import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react'
import WebSocket from 'isomorphic-ws'
import { InterArrivalTime } from './App'
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
import ControlsInvertedSheetImage from '../resources/images/controls_inverted_sprite_sheet_6_frames.png'
import {SpriteSheetAnimator} from "../services/SpriteSheetAnimator"
import { GameState, GameObject, Player, HomingBall, FireBall, PowerUp } from "../interfaces/GameStateModels"
import { commandRegistry } from '../services/CommandRegistry'
import { SendInputStateToServerDTO } from '../interfaces/DTO'
import { BackToLobbyToServerDTO } from '../interfaces/DTO'
import { SendSpaceBallsGameStateToClientsDTO } from '../interfaces/DTO'

// Component config
interface SpaceBallsProps {
    socketRef: React.MutableRefObject<WebSocket | null>
    yourId: string
}

interface SpaceBallsMethods {
    onGameStateChange: (newState: string, iat: InterArrivalTime) => void
}

interface InputState {
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

interface GameStates {
    server: GameState
    previous: GameState
    interpolated: GameState
    predicted: GameState
}

// Use forwardRef to allow refs to be forwarded to this component
const SpaceBalls = forwardRef<SpaceBallsMethods, SpaceBallsProps>((props, ref) => {

    const { socketRef, yourId } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const init : InputState = { wKey: false, aKey: false, sKey: false, dKey: false }
    const inputState = useRef<InputState>(init)

    let gameLoopState: GameloopState = GameloopState.NOT_STARTED
    // Note this might get semi-overridden as requestAnimationFrame has its own rate.
    const frameRate: number = 60
    const fps = useRef<number>(frameRate)
    const fpsHistory = useRef<BoundedStack<number>>(new BoundedStack<number>(60))
    const fpsRenderingEnabled = useRef<boolean>(false) 
    
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

    const shieldAnimation = new SpriteSheetAnimator(shieldSpriteSheet, 80, 80, 4)
    const controlsInvertedAnimation = new SpriteSheetAnimator(controlsInvertedSheet, 55, 50, 6)

    const powerUpWidth: number = 40
    const powerUpHeight: number = 40
    const playerWidth: number = 60
    const playerHeight: number = 42
    const homingBallRadius: number = 25
    const homingBallImageWidth: number = 40
    const homingBallImageHeight: number = 40

    const fireBallDiameter: number = 50

    let gizmosEnabled: boolean = false
    let interpolationEnabled: boolean = true

    let iat: InterArrivalTime = {
        current: undefined,
        average: undefined,
        lastMillis: undefined,
        timeline: new BoundedStack<number>(100)
    }

    const gameStateInit: GameState = { players: [], fireBalls: [], powerUps: [], homingBalls: [] }
    const gameStatesInit: GameStates = {
        server: gameStateInit, 
        interpolated: gameStateInit, 
        predicted: gameStateInit, 
        previous: gameStateInit
    }
    const gs = useRef<GameStates>(gameStatesInit)

    // Use useImperativeHandle to expose specific functions to parent Components.
    useImperativeHandle(ref, () => ({
        onGameStateChange(newState: string, tempIat: InterArrivalTime) {
            iat = tempIat

            let gameStateDTO: SendSpaceBallsGameStateToClientsDTO = JSON.parse(newState)

            gs.current.previous = deepCopy(gs.current.server)
            gs.current.interpolated = deepCopy(gs.current.previous)
            gs.current.server = gameStateDTO.gameState            
        }
    }))

    // This is a hacky implementation to create a copy of a object instead of just copying the reference
    function deepCopy<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    useEffect(() => {
        setupDevConsoleCommands()
        setupKeyboardInput()
        setupImages()
        shieldAnimation.setTickRate(5)
        controlsInvertedAnimation.setTickRate(8)

        if(gameLoopState == GameloopState.NOT_STARTED){
            gameLoopState = GameloopState.RUNNING
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
        let millisPerFrame = 1000 / frameRate    

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
            if(deltaTimeSinceLastSecond >= 1000){
                fpsHistory.current.push(fps.current)
                fps.current = framesInSecond
                framesInSecond = 0
                lastSecondTime += 1000
            }
    
            if (gameLoopState === GameloopState.RUNNING) {
                requestAnimationFrame(tick) // Schedule the next frame
            }
        }

        requestAnimationFrame(tick)
    }

    function tickFrame() {
        if (canvasRef.current){
            if ("getContext" in canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d')
                if(ctx){
                    if (interpolationEnabled) interpolateGamestate()
                    predictGamestate()
                    setupImages()
                    render(ctx, canvasRef.current)
                }
            }
        }
    }

    function setupDevConsoleCommands(){
        // Command to toggle gizmo rendering.
        commandRegistry.registerCommand('gizmos', (arg1: string) => { 
            if(arg1 === "on") { gizmosEnabled = true; return }
            if(arg1 === "off") { gizmosEnabled = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")
        })

        // Command to toggle Gamestate interpolation.
        commandRegistry.registerCommand('csi', (arg1: string) => {
            if(arg1 === "on") { interpolationEnabled = true; return }
            if(arg1 === "off") { interpolationEnabled = false; return }
            throw new Error(arg1 + " is not a valid parameter. Use 'on' or 'off'")           
        })

        // Command to toggle FPS rendering.
        commandRegistry.registerCommand('fps', (arg1: string) => {
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
                case "Escape": requestToGoBackToLobby(); return;
            }
            sendInputStateToServer()
        })
    }

    function requestToGoBackToLobby(){
        let dto: BackToLobbyToServerDTO = { playerId: yourId, messageType: "backToLobbyToServer" }

        if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
            if (socketRef.current instanceof WebSocket) {
                gameLoopState = GameloopState.PAUSED
                socketRef.current.send(JSON.stringify(dto))
            }
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    function sendInputStateToServer() {
        let dto: SendInputStateToServerDTO = {
            sessionId: yourId, messageType: "sendInputStateToServer",
            wKey: inputState.current.wKey, aKey: inputState.current.aKey,
            sKey: inputState.current.sKey, dKey: inputState.current.dKey
        }

        if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
            if (socketRef.current instanceof WebSocket) {
                socketRef.current.send(JSON.stringify(dto))
            }
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    // Interpolate certain gameobjects between gs.previous and gs.server
    function interpolateGamestate() {
        if (!iat.average || !iat.lastMillis || !gs) return

        const millisSinceGsUpdate = Date.now() - iat.lastMillis
        const interpolationFactor = millisSinceGsUpdate / iat.average

        function interpolateObjects<T extends GameObject>(
            previousObjects: T[], 
            serverObjects: T[], 
            interpolatedObjects: T[]
        ) {
            const serverMap = new Map(serverObjects.map(obj => [obj.id, obj]))
            const interpolatedMap = new Map(interpolatedObjects.map(obj => [obj.id, obj]))

            previousObjects.forEach(previousObj => {
                // Calculate correction factor
                const serverObj = serverMap.get(previousObj.id)
                const interpolatedObj = interpolatedMap.get(previousObj.id)
                if (!serverObj || !interpolatedObj) return

                const distanceX = serverObj.x - previousObj.x
                const distanceY = serverObj.y - previousObj.y
                interpolatedObj.x = previousObj.x + distanceX * interpolationFactor
                interpolatedObj.y = previousObj.y + distanceY * interpolationFactor
            })
        }

        // Interpolate all game objects
        interpolateObjects(gs.current.previous.fireBalls, gs.current.server.fireBalls, gs.current.interpolated.fireBalls)
        interpolateObjects(gs.current.previous.players, gs.current.server.players, gs.current.interpolated.players)
        interpolateObjects(gs.current.previous.homingBalls, gs.current.server.homingBalls, gs.current.interpolated.homingBalls)
    }

    // Math / Pseudocode for better Client side interpolation. 
    // interpolationFrameTranslation X,Y = Dist(gs.I -> gs.S) / AvgInterpolationFrames
    // AvgInterpolationFrames = iat.average / AvgInterpolationFrameDuration
    // AvgInterpolationFrameDuration = 1000 / FPS 
    function interpolateGameStateNonSnappingOnCorrection() {

    }

    function predictGamestate(){

    }

    function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement){
        if(gs === undefined) return
        let renderGs = interpolationEnabled ? gs.current.interpolated : gs.current.server

        // Render Background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Render homing balls
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.homingBalls.forEach((homingBall) => {
                ctx.fillStyle = "#0000ff"
                drawCircle(ctx, homingBall.x + homingBallImageWidth/2, homingBall.y + homingBallImageHeight/2, homingBallRadius)
            })
            gs.current.previous.homingBalls.forEach((homingBall) => {
                ctx.fillStyle = "#00ffff"
                drawCircle(ctx, homingBall.x + homingBallImageWidth/2, homingBall.y + homingBallImageHeight/2, homingBallRadius)
            })
        }
        renderGs.homingBalls.forEach((homingBall) => {
            ctx.drawImage(homingBallImage, homingBall.x-5 , homingBall.y-5, homingBallImageWidth+10, homingBallImageHeight+10)
        })

        // Render players
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.players.forEach((player) => {
                ctx.fillStyle = "#0000ff"
                ctx.fillRect(player.x, player.y, playerWidth, playerHeight)
            })
            gs.current.previous.players.forEach((player) => {
                ctx.fillStyle = "#00ffff"
                ctx.fillRect(player.x, player.y, playerWidth, playerHeight)
            })
        }
        renderGs.players.forEach((player) => {
            ctx.fillStyle = '#ffffff'
            ctx.font = '17px Arial'
            ctx.fillText(player.name, player.x, player.y - 12)

            if(player.health > 0){
                ctx.fillStyle = '#8a2be2'
                ctx.drawImage(saucerImage, player.x, player.y, playerWidth, playerHeight)
                if(player.shield) {
                    let xOffset = 5
                    let yOffset = 12
                    shieldAnimation.drawFrame(ctx,
                        player.x - xOffset, player.y - yOffset,
                        playerWidth + 10, playerWidth + 10)
                }
                if(player.inverted) {
                    controlsInvertedAnimation.drawFrame(ctx, player.x, player.y, playerWidth, playerHeight)
                }
            } else if (player.health === 0) {
                ctx.drawImage(skullImage, player.x, player.y, playerWidth, playerHeight)
            }
        })

        // Render powerUps
        renderGs.powerUps.forEach((powerUp) => {
            switch (powerUp.type) {
                case "inverter":
                    ctx.drawImage(inverterImage,
                        powerUp.x-5 , powerUp.y-5, powerUpWidth+10, powerUpHeight+10)
                    break
                case "med_kit":
                    ctx.drawImage(medKitImage, powerUp.x , powerUp.y, powerUpWidth, powerUpHeight)
                    break
                case "shield":
                    shieldAnimation.drawFrame(
                        ctx, powerUp.x , powerUp.y,
                        powerUpWidth * 1.5, powerUpHeight * 1.5)
                    break
                case "control_inverter":
                    ctx.drawImage(controlInverterPUImage,
                        powerUp.x-5 , powerUp.y-5, powerUpWidth+10, powerUpHeight+10)
            }
        })

        // Render fireBalls
        if(gizmosEnabled && interpolationEnabled){
            gs.current.server.fireBalls.forEach((ball) => {
                ctx.fillStyle = "#0000ff"
                drawCircle(ctx, ball.x, ball.y, fireBallDiameter/2)
            })
            gs.current.previous.fireBalls.forEach((ball) => {
                ctx.fillStyle = "#00ffff"
                drawCircle(ctx, ball.x, ball.y, fireBallDiameter/2)  
            })
        }
        renderGs.fireBalls.forEach(ball => {
            ctx.drawImage(meteoriteImage, ball.x - fireBallDiameter/2, ball.y - fireBallDiameter/2, fireBallDiameter, fireBallDiameter)
        })

        // Render HUD
        let startY = 30
        let startX = 20
        let spacingX = 30
        let spacingY = 47
        for (let playerIdx = 0; playerIdx < renderGs.players.length; playerIdx++) {
            let player: Player = gs.current.server.players[playerIdx]

            ctx.fillStyle = '#ffffff'
            ctx.font = '15px Arial'
            ctx.fillText(player.name, startX, startY + spacingY * playerIdx)

            for (let j = 1; j < player.health + 1; j++) {
                ctx.drawImage(heartImage, startX + spacingX * (j - 1), startY + 8 + spacingY * playerIdx, 20, 20)
            }
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

    function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number){
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()  
    }

    return (
        <div>
            <canvas ref={canvasRef} width="1100" height="650"></canvas>
        </div>
    )
})

export default SpaceBalls