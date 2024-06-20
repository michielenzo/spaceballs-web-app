import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react'
import WebSocket from 'isomorphic-ws'
import { InterArrivalTime } from './App'
import '../css/Generic.css'
import { BoundedStack } from './../services/BoundedStack'
import ArrowsImage from '../resources/images/arrows.png'
import HeartImage from '../resources/images/heart_cropped.jpg'
import MedKitImage from '../resources/images/medkit.png'
import SkullImage from '../resources/images/skull_cropped.png'
import MeteoriteImage from '../resources/images/meteorite-cropped.png'
import ShieldSheetImage from '../resources/images/shield-spritesheet_cropped.png'
import SaucerImage from '../resources/images/saucer.png'
import ControlInverterPU from '../resources/images/conrol_inverter_powerup.png'
import HomingBallImage from '../resources/images/homing_ball.png'
import YellowArrowImage from '../resources/images/yellow_arrow_diagonal_cropped.png'
import ControlsInvertedSheetImage from '../resources/images/controls_inverted_sprite_sheet_6_frames.png'
import {SpriteSheetAnimator} from "../engine/SpriteSheetAnimator"
import { GameState, GameObject, Player, HomingBall, Meteorite, PowerUp, GameEvent, GameEventType } from "../interfaces/GameStateModels"
import { commandRegistry } from '../services/CommandRegistry'
import { GameConfigToClientsDTO, MsgType, SendInputStateToServerDTO } from '../interfaces/DTO'
import { BackToRoomToServerDTO } from '../interfaces/DTO'
import { SendSpaceBallsGameStateToClientsDTO } from '../interfaces/DTO'
import { Vec2D } from '../utility/math'
import { applyCSP, prepareCSP } from '../engine/ClientSidePrediction'
import { interpolateGamestate_FactorTranslation } from '../engine/ClientSideInterpolation'
import { interpolateGameState_RawTranslation } from '../engine/ClientSideInterpolation'
import { prepareInterpolation_RawTranslation } from '../engine/ClientSideInterpolation'
import { deepCopy } from '../utility/Other'

// Component config
interface Props {
    socketRef: React.MutableRefObject<WebSocket | null>
    yourId: string
}

export interface SpaceBallsMethods {
    onGameStateChange: (newState: string, iat: InterArrivalTime) => void
    onRecieveGameConfig: (gameConfig: GameConfigToClientsDTO) => void
}

export interface InputState {
    wKey: boolean
    aKey: boolean
    sKey: boolean
    dKey: boolean
}

enum GameloopState{
    NOT_STARTED,
    RUNNING,
    PAUSED
}

export interface GameStates {
    server: GameState
    previous: GameState
    interpolated: GameState
    predicted: GameState
}

// Use forwardRef to allow refs to be forwarded to this component
const SpaceBalls = forwardRef<SpaceBallsMethods, Props>((props, ref) => {

    const { socketRef, yourId } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const canvasWidth: number = 1100
    const canvasHeight: number = 650

    const init : InputState = { wKey: false, aKey: false, sKey: false, dKey: false }
    const inputState = useRef<InputState>(init)

    const gameLoopState = useRef<GameloopState>(GameloopState.NOT_STARTED)
    // Note this might get semi-overridden as requestAnimationFrame has its own rate.
    const frameRate: number = 60
    
    const fps = useRef<number>(frameRate)
    const fpsHistory = useRef<BoundedStack<number>>(new BoundedStack<number>(60))
    const fpsRenderingEnabled = useRef<boolean>(false) 

    const millisPerSecond = 1000
    // Multiply movement translation with this factor to make the speed fps independent.
    const speedFactor = useRef<number>((millisPerSecond / frameRate) / millisPerSecond)
    
    const medKitImage = new Image()
    const inverterImage = new Image()
    const heartImage = new Image()
    const skullImage = new Image()
    const meteoriteImage = new Image()
    const saucerImage = new Image()
    const shieldSpriteSheet = new Image()
    const controlInverterPUImage = new Image()
    const homingBallImage = new Image()
    const controlsInvertedSheet = new Image()
    const yellowArrowImage = new Image()

    const shieldAnimation = new SpriteSheetAnimator(shieldSpriteSheet, 80, 80, 4)
    const controlsInvertedAnimation = new SpriteSheetAnimator(controlsInvertedSheet, 55, 50, 6)
    
    const gameConfigInit: GameConfigToClientsDTO = {
        powerUpWidth: 0, powerUpHeight: 0,
        playerWidth: 0, playerHeight: 0,
        homingBallRadius: 0,meteoriteDiameter: 0,
        playerSpeed: 0, messageType: "",
        countdownMillis: 0,
        meteoritesDirectionInit: []
    }    
    const gcfg = useRef<GameConfigToClientsDTO>(gameConfigInit)

    const meteoritesFreezed = useRef<boolean>(true)
    const countdownCount = useRef<number>(0)
    const countdownStarted = useRef<boolean>(true)

    let gizmosEnabled: boolean = false
    let interpolationEnabled: boolean = true

    let iatInit: InterArrivalTime = {
        current: undefined,
        average: undefined,
        lastMillis: undefined,
        timeline: new BoundedStack<number>(100)
    }
    const iat = useRef<InterArrivalTime>(iatInit)

    const gameStateInit: GameState = { players: [], meteorites: [], powerUps: [], homingBalls: [], events: [] }
    const gameStatesInit: GameStates = {
        server: gameStateInit, 
        interpolated: gameStateInit, 
        predicted: gameStateInit, 
        previous: gameStateInit
    }
    const interpolatedGsSet = useRef<boolean>(false)
    const predictedGsSet = useRef<boolean>(false)
    const gs = useRef<GameStates>(gameStatesInit)

    // IFT is a acronym for interpolationFrameTranslation (self invented), 
    // which represents the translation for each object to interpolate should translate each interpolation frame. 
    // This map maps each interpolation object with its translation vector.
    const IFTMapping = useRef<Map<number, Vec2D>>(new Map<number, Vec2D>())

    const CSI_Strategy_RawTranslation = "RawTranslation"
    const CSI_Strategy_FactorTranslation = "FactorTranslation"
    const interpolationStrategy = useRef<String>(CSI_Strategy_FactorTranslation)

    // CSP
    const playerPredictionEnabled = useRef<boolean>(true)

    // Use useImperativeHandle to expose specific functions to parent Components.
    useImperativeHandle(ref, () => ({
        onGameStateChange(newState: string, tempIat: InterArrivalTime) {
            iat.current = tempIat

            let gameStateDTO: SendSpaceBallsGameStateToClientsDTO = JSON.parse(newState)
            
            processGameEvents(gameStateDTO.gameState.events)

            gs.current.previous = deepCopy(gs.current.server)
            if(interpolationStrategy.current === CSI_Strategy_FactorTranslation) {
                gs.current.interpolated = deepCopy(gs.current.previous)
            }
            gs.current.server = gameStateDTO.gameState   
            
            if(interpolationStrategy.current === CSI_Strategy_RawTranslation) {
                prepareInterpolation_RawTranslation(
                    gs.current.server, gs.current.interpolated,
                    iat.current, IFTMapping.current, fps.current
                )
            }

            if(playerPredictionEnabled) {
                if(predictedGsSet.current === false){
                    gs.current.predicted = deepCopy(gs.current.server)
                    predictedGsSet.current = true
                }
                prepareCSP(gs.current.predicted, gs.current.server, yourId)
            }
        },
        onRecieveGameConfig(gameConfig: GameConfigToClientsDTO) {
           gcfg.current = gameConfig
           countdownCount.current = Math.round(gcfg.current.countdownMillis / 1000)
           countdown()
        },
    }))

    function processGameEvents(events: GameEvent[]) {
        //if(events.length > 0) console.log(events)
        events.forEach((e) => {
            switch(e.type){
                case GameEventType.METEORITES_UNFREEZE: 
                    meteoritesFreezed.current = false
                    break
            }
        })    
    }

    useEffect(() => {
        setupDevConsoleCommands()
        setupKeyboardInput()
        setupImages()
        shieldAnimation.setTickRate(5)
        controlsInvertedAnimation.setTickRate(8)

        if(gameLoopState.current == GameloopState.NOT_STARTED){
            gameLoopState.current = GameloopState.RUNNING
            gameLoop()
        }
    }, [])


    /*
     *  This Gameloop implementation uses a recursive structure.
     *  It loops on the animation frame which is optimized for animations.
     *  A regular while loop in a async function will be blocking.
     */
    function gameLoop() {
        let lastFrameTime = Date.now()
        let millisPerFrame = millisPerSecond / frameRate    

        let framesInSecond = 0
        let lastSecondTime = Date.now()

        const tick = () => {
            const now = Date.now()
            const deltaTime = now - lastFrameTime
    
            if (deltaTime >= millisPerFrame) {
                tickFrame()
                lastFrameTime = now - (deltaTime % millisPerFrame)
                framesInSecond++
            }

            // Calculate FPS
            const deltaTimeSinceLastSecond = now - lastSecondTime
            if(deltaTimeSinceLastSecond >= millisPerSecond){
                fpsHistory.current.push(fps.current)
                fps.current = framesInSecond
                framesInSecond = 0
                lastSecondTime += millisPerSecond

                speedFactor.current = (millisPerSecond / fps.current) / millisPerSecond
            }
    
            if (gameLoopState.current === GameloopState.RUNNING) {
                requestAnimationFrame(tick) // Schedule the next frame
            }
        }

        requestAnimationFrame(tick)
    }

    function countdown(){
        setTimeout(() => {
            countdownCount.current--
            if(countdownCount.current > 0) {
                countdown()
            }
        }, 1000)
    }


    function tickFrame() {
        if (canvasRef.current){
            if ("getContext" in canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d')
                if(ctx){
                    if (interpolationEnabled && interpolationStrategy.current === CSI_Strategy_RawTranslation) {
                        interpolateGameState_RawTranslation(gs.current.interpolated, IFTMapping.current)
                    } else if (interpolationEnabled && interpolationStrategy.current === CSI_Strategy_FactorTranslation) {
                        interpolateGamestate_FactorTranslation(iat.current, gs.current)    
                    }
                    if(playerPredictionEnabled){
                        applyCSP(
                            gs.current.predicted, yourId, 
                            inputState.current, speedFactor.current,
                            canvasWidth, canvasHeight, gcfg.current.playerWidth, gcfg.current.playerHeight,
                            gcfg.current.playerSpeed
                        )
                    } 
                    setupImages()
                    render(ctx, canvasRef.current)
                }
            }
        }
    }

    function setupDevConsoleCommands(){
        // Command to toggle gizmo rendering.
        commandRegistry.register('gizmos', (arg1: string) => { 
            if(arg1 === "on") { gizmosEnabled = true; return }
            if(arg1 === "off") { gizmosEnabled = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")
        })

        // Command to toggle Gamestate interpolation.
        commandRegistry.register('csi', (arg1: string) => {
            if(arg1 === "on") { interpolationEnabled = true; return }
            if(arg1 === "off") { interpolationEnabled = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")           
        })

        // Command to toggle Player CSP.
        commandRegistry.register('csp', (arg1: string) => {
            if(arg1 === "on") { playerPredictionEnabled.current = true; return }
            if(arg1 === "off") { playerPredictionEnabled.current = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")           
        })

        // Command to switch between CSI strategies
        commandRegistry.register('csi-strategy', (arg1: string) => {
            if(arg1 === "factor") { interpolationStrategy.current = CSI_Strategy_FactorTranslation; return }
            if(arg1 === "raw") { interpolationStrategy.current = CSI_Strategy_RawTranslation; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'factor' or 'raw'")           
        })

        // Command to toggle FPS rendering.
        commandRegistry.register('fps', (arg1: string) => {
            if(arg1 === "on") { fpsRenderingEnabled.current = true; return }
            if(arg1 === "off") { fpsRenderingEnabled.current = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")           
        })
    }
    
    function setupImages(){
        if(medKitImage.src === "") medKitImage.src = MedKitImage as string
        if(inverterImage.src === "") inverterImage.src = ArrowsImage as string
        if(heartImage.src === "") heartImage.src = HeartImage as string
        if(skullImage.src === "") skullImage.src = SkullImage as string
        if(meteoriteImage.src === "") meteoriteImage.src = MeteoriteImage as string
        if(saucerImage.src === "") saucerImage.src = SaucerImage as string
        if(shieldSpriteSheet.src === "") shieldSpriteSheet.src = ShieldSheetImage as string
        if(controlInverterPUImage.src === "") controlInverterPUImage.src = ControlInverterPU as string
        if(homingBallImage.src === "") homingBallImage.src = HomingBallImage as string
        if(controlsInvertedSheet.src === "") controlsInvertedSheet.src = ControlsInvertedSheetImage as string
        if(yellowArrowImage.src === "") yellowArrowImage.src = YellowArrowImage as string
    }

    function setupKeyboardInput(){
        document.addEventListener("keydown",(event) => {
            let stateChanged = false

            switch (event.code) {
                case "KeyW": if (!inputState.current.wKey) { inputState.current.wKey = true; stateChanged = true } break
                case "KeyA": if (!inputState.current.aKey) { inputState.current.aKey = true; stateChanged = true } break
                case "KeyS": if (!inputState.current.sKey) { inputState.current.sKey = true; stateChanged = true } break
                case "KeyD": if (!inputState.current.dKey) { inputState.current.dKey = true; stateChanged = true } break
            }

            if (stateChanged) { sendInputStateToServer() }
        })

        document.addEventListener("keyup",(event) => {
            switch (event.code){
                case "KeyW": inputState.current.wKey = false; break
                case "KeyA": inputState.current.aKey = false; break
                case "KeyS": inputState.current.sKey = false; break
                case "KeyD": inputState.current.dKey = false; break
                case "Escape": requestToGoBackToRoom(); return;
            }
            sendInputStateToServer()
        })
    }

    function requestToGoBackToRoom(){
        let dto: BackToRoomToServerDTO = { 
            playerId: yourId, messageType: MsgType.BACK_TO_ROOM_TO_SERVER.toString() 
        }

        if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
            if (socketRef.current instanceof WebSocket) {
                gameLoopState.current = GameloopState.PAUSED
                socketRef.current.send(JSON.stringify(dto))
            }
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    function sendInputStateToServer() {
        let dto: SendInputStateToServerDTO = {
            sessionId: yourId, messageType: MsgType.SEND_INPUT_STATE_TO_SERVER.toString(),
            wKey: inputState.current.wKey, aKey: inputState.current.aKey,
            sKey: inputState.current.sKey, dKey: inputState.current.dKey
        }

        if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
            if (socketRef.current instanceof WebSocket) {
                socketRef.current.send(JSON.stringify(dto))
            }
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement){
        if(gs === undefined) return
        const renderGs = interpolationEnabled ? gs.current.interpolated : gs.current.server
        const cfg = gcfg.current

        // Render Background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Render homing balls
        const homingBallImageWidth: number = cfg.homingBallRadius * 1.6
        const homingBallImageHeight: number = cfg.homingBallRadius * 1.6
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.homingBalls.forEach((homingBall) => {
                ctx.fillStyle = "#0000ff"
                drawCircle(ctx, homingBall.x + homingBallImageWidth/2, homingBall.y + homingBallImageHeight/2, cfg.homingBallRadius)
            })
            gs.current.previous.homingBalls.forEach((homingBall) => {
                ctx.fillStyle = "#00ffff"
                drawCircle(ctx, homingBall.x + homingBallImageWidth/2, homingBall.y + homingBallImageHeight/2, cfg.homingBallRadius)
            })
        }
        renderGs.homingBalls.forEach((homingBall) => {
            ctx.drawImage(homingBallImage, homingBall.x-5 , homingBall.y-5, homingBallImageWidth+10, homingBallImageHeight+10)
        })

        // Render player Gizmos
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.players.forEach((player) => {
                ctx.fillStyle = "#0000ff"
                ctx.fillRect(player.x, player.y, cfg.playerWidth, cfg.playerHeight)
            })
            gs.current.previous.players.forEach((player) => {
                ctx.fillStyle = "#00ffff"
                ctx.fillRect(player.x, player.y, cfg.playerWidth, cfg.playerHeight)
            })
        }

        // Render players
        const renderPlayer = (player: Player) => {
            ctx.fillStyle = '#ffffff'
            ctx.font = '17px Arial'
            ctx.fillText(player.name, player.x, player.y - 12)
        
            if (player.health > 0) {
                ctx.fillStyle = '#8a2be2'
                ctx.drawImage(saucerImage, player.x, player.y, cfg.playerWidth, cfg.playerHeight)
        
                if (player.shield) {
                    let xOffset = 5
                    let yOffset = 12
                    shieldAnimation.drawFrame(ctx,
                        player.x - xOffset, player.y - yOffset,
                        cfg.playerWidth + 10, cfg.playerWidth + 10)
                }
        
                if (player.inverted) {
                    controlsInvertedAnimation.drawFrame(ctx, player.x, player.y, cfg.playerWidth, cfg.playerHeight)
                }
            } else if (player.health === 0) {
                ctx.drawImage(skullImage, player.x, player.y, cfg.playerWidth, cfg.playerHeight)
            }
        }
        
        if(playerPredictionEnabled.current === true){
            // Render your player
            gs.current.predicted.players
                .filter(p => p.sessionId === yourId)
                .forEach(renderPlayer)
            
            // Render other players
            renderGs.players
                .filter(p => p.sessionId !== yourId)
                .forEach(renderPlayer)
        } else {
            // Render all players
            renderGs.players.forEach(renderPlayer)
        }


        // Render powerUps
        renderGs.powerUps.forEach((powerUp) => {
            switch (powerUp.type) {
                case "inverter":
                    ctx.drawImage(inverterImage,
                        powerUp.x-5 , powerUp.y-5, cfg.powerUpWidth+10, cfg.powerUpHeight+10)
                    break
                case "med_kit":
                    ctx.drawImage(medKitImage, powerUp.x , powerUp.y, cfg.powerUpWidth, cfg.powerUpHeight)
                    break
                case "shield":
                    shieldAnimation.drawFrame(
                        ctx, powerUp.x , powerUp.y,
                        cfg.powerUpWidth * 1.5, cfg.powerUpHeight * 1.5)
                    break
                case "control_inverter":
                    ctx.drawImage(controlInverterPUImage,
                        powerUp.x-5 , powerUp.y-5, cfg.powerUpWidth+10, cfg.powerUpHeight+10)
            }
        })

        // Render meteorites
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.meteorites.forEach((ball) => {
                ctx.fillStyle = "#0000ff"
                drawCircle(ctx, ball.x, ball.y, cfg.meteoriteDiameter/2)
            })
            gs.current.previous.meteorites.forEach((ball) => {
                ctx.fillStyle = "#00ffff"
                drawCircle(ctx, ball.x, ball.y, cfg.meteoriteDiameter/2)  
            })
        }
        renderGs.meteorites.forEach(ball => {
            ctx.drawImage(meteoriteImage, 
                ball.x - cfg.meteoriteDiameter/2, 
                ball.y - cfg.meteoriteDiameter/2, 
                cfg.meteoriteDiameter, 
                cfg.meteoriteDiameter
            )

            if(meteoritesFreezed.current){
                const direction = cfg.meteoritesDirectionInit.find(m => m.id === ball.id)?.direction
                let xOffset = -(cfg.meteoriteDiameter/2)
                let yOffset = -(cfg.meteoriteDiameter/2)
                switch(direction) {
                    case "DOWN_RIGHT":
                         drawImageFlipped(ctx, yellowArrowImage, ball.x + xOffset + 45, ball.y + yOffset + 45, 40, 40, true, false)
                         break
                    case "UP_RIGHT":
                        drawImageFlipped(ctx, yellowArrowImage, ball.x + xOffset + 44, ball.y + yOffset - 38, 40, 40, true, true) 
                        break
                    case "DOWN_LEFT": 
                        drawImageFlipped(ctx, yellowArrowImage, ball.x + xOffset - 35, ball.y + yOffset + 48, 40, 40, false, false)
                        break
                    case "UP_LEFT": 
                        drawImageFlipped(ctx, yellowArrowImage, ball.x + xOffset - 35, ball.y + yOffset - 35, 40, 40, false, true) 
                        break
                }
            }
        })

        // Render HUD
        const startY = 30
        const startX = 20
        const spacingX = 30
        const spacingY = 47
        for (let playerIdx = 0; playerIdx < renderGs.players.length; playerIdx++) {
            let player: Player = gs.current.server.players[playerIdx]
            if(!player) return
            ctx.fillStyle = '#ffffff'
            ctx.font = '15px Arial'
            ctx.fillText(player.name, startX, startY + spacingY * playerIdx)

            for (let j = 1; j < player.health + 1; j++) {
                ctx.drawImage(heartImage, startX + spacingX * (j - 1), startY + 8 + spacingY * playerIdx, 20, 20)
            }
        }

        // Countdown counter
        if(meteoritesFreezed.current && countdownCount.current > 0) {
            ctx.font = '100px Arial'
            ctx.fillStyle = '#ffffff'
            ctx.fillText(countdownCount.current.toString(), canvasWidth/2 , canvasHeight/2)
        }

        // Render FPS 
        if(fpsRenderingEnabled.current){
            ctx.fillStyle = '#ffffff'
            ctx.font = '15px Arial'
            ctx.fillText("FPS: " + fps.current, 1025, 28)
        }

        shieldAnimation.tick()
        controlsInvertedAnimation.tick()
    }

    function drawImageFlipped(
        ctx: CanvasRenderingContext2D,
        image: CanvasImageSource,
        xPos: number, yPos: number,
        width: number, height: number,
        horizontal: boolean, vertical: boolean
    ){
        if(horizontal && vertical){
            ctx.translate(xPos + width/2, yPos + height/2);
            ctx.scale(-1,-1)
            ctx.drawImage(image, -(width / 2), -(height / 2), width, height);
            ctx.setTransform(1,0,0,1,0,0);
        } else if (horizontal) {
            ctx.translate(xPos,0);
            ctx.scale(-1,1);
            ctx.drawImage(image, -width, yPos, width, height);
            ctx.setTransform(1,0,0,1,0,0);
        } else if (vertical) {
            ctx.translate(0,yPos);
            ctx.scale(1,-1);
            ctx.drawImage(image, xPos, -height, width, height);
            ctx.setTransform(1,0,0,1,0,0);
        } else {
            ctx.drawImage(image, xPos, yPos, width, height)
        }
    }

    function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number){
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()  
    }

    return (
        <div>
            <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}></canvas>
        </div>
    )
})

export default SpaceBalls