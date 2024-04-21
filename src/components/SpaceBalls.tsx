import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react'
import WebSocket from 'isomorphic-ws'
import { InterArrivalTime } from '../App'
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

// Component config
interface SpaceBallsProps {
    socketRef: React.MutableRefObject<WebSocket | null>
    yourId: string
}

interface SpaceBallsMethods {
    onGameStateChange: (newState: string, iat: InterArrivalTime) => void
}

// GameState
interface SendSpaceBallsGameStateToClientsDTO {
    gameState: GameState
    messageType: string
}

interface GameState {
    players: Player[]
    fireBalls: FireBall[]
    powerUps: PowerUp[]
    homingBalls: HomingBall[]
}

interface Player {
    id: number
    sessionId: string
    name: string
    x: number
    y: number
    health: number
    shield: boolean
    inverted: boolean
}

interface HomingBall {
    id: number
    x: number,
    y: number
}

interface FireBall {
    id: number
    x: number
    y: number
}

interface PowerUp {
    type: string
    x: number
    y: number
}

interface InputState {
    wKey: boolean
    aKey: boolean
    sKey: boolean
    dKey: boolean
}

interface SendInputStateToServerDTO {
    wKey: boolean
    aKey: boolean
    sKey: boolean
    dKey: boolean
    messageType: "sendInputStateToServer"
    sessionId: string
}

interface BackToLobbyToServerDTO {
    playerId: string
    messageType: "backToLobbyToServer"
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
    const fireBallDiameter: number = 50

    const gizmosEnabled: boolean = process.env.REACT_APP_GIZMOS !== undefined && process.env.REACT_APP_GIZMOS === "true"

    let iat: InterArrivalTime = {
        current: undefined,
        average: undefined,
        lastMillis: undefined,
        timeline: new BoundedStack<number>(100)
    }

    let gs: GameStates

    // Use useImperativeHandle to expose specific functions to parent Components.
    useImperativeHandle(ref, () => ({
        onGameStateChange(newState: string, tempIat: InterArrivalTime) {
            iat = tempIat

            let gameStateDTO: SendSpaceBallsGameStateToClientsDTO = JSON.parse(newState)
            
            if(gs === undefined){
                gs = {
                    server: gameStateDTO.gameState,
                    previous: gameStateDTO.gameState,
                    predicted: gameStateDTO.gameState,
                    interpolated: gameStateDTO.gameState
                }
            } else {
                gs.previous = deepCopy(gs.server)
                gs.interpolated = deepCopy(gs.server)
                gs.server = gameStateDTO.gameState
            }               
        }
    }))

    // This is a hacky implementation to create a copy of a object instead of just copying the reference
    function deepCopy<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    useEffect(() => {
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

        const tick = () => {
            const now = Date.now()
            const deltaTime = now - lastFrameTime
    
            if (deltaTime >= millisPerFrame) {
                tickFrame()
                lastFrameTime = now - (deltaTime % millisPerFrame)
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
                    interpolateGamestate()
                    predictGamestate()
                    setupImages()
                    render(ctx, canvasRef.current)
                }
            }
        }
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
    function interpolateGamestate(){
        if(iat.current == undefined) return
        if(iat.timeline == undefined) return
        if(iat.average == undefined) return
        if(iat.lastMillis == undefined) return
        if(gs === undefined) return

        // Todo: map objects with an id so that they can be traced between gamestates. 
        // This will prevent bug in case a object is added or deleted.
        let previousObj: FireBall = gs.previous.fireBalls[0]
        let serverObj: FireBall = gs.server.fireBalls[0]        
        let millisSinceGsUpdate = Date.now() - iat.lastMillis
        let interpolationFactor = millisSinceGsUpdate / iat.average
        let distanceX = serverObj.x - previousObj.x
        let distanceY = serverObj.y - previousObj.y
        let xPosGain = distanceX * interpolationFactor
        let yPosGain = distanceY * interpolationFactor
        gs.interpolated.fireBalls[0].x = gs.previous.fireBalls[0].x + xPosGain
        gs.interpolated.fireBalls[0].y = gs.previous.fireBalls[0].y + yPosGain
    }

    function predictGamestate(){

    }

    function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement){
        if(gs === undefined) return

        // Render Background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Render homing balls
        gs.server.homingBalls.forEach((homingBall) => {
            ctx.drawImage(homingBallImage, homingBall.x-5 , homingBall.y-5, powerUpWidth+10, powerUpHeight+10)
        })

        // Render players
        gs.server.players.forEach((player) => {
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
        gs.server.powerUps.forEach((powerUp) => {
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
        if(gizmosEnabled){
            gs.server.fireBalls.forEach((ball) => {
                ctx.fillStyle = "#0000ff"
                drawCircle(ctx, ball.x, ball.y, fireBallDiameter/2)
            })
            gs.previous.fireBalls.forEach((ball) => {
                ctx.fillStyle = "#00ffff"
                drawCircle(ctx, ball.x, ball.y, fireBallDiameter/2)  
            })
        }
        gs.interpolated.fireBalls.forEach(ball => {
            ctx.drawImage(meteoriteImage, ball.x - fireBallDiameter/2, ball.y - fireBallDiameter/2, fireBallDiameter, fireBallDiameter)
        })

        // Render HUD
        let startY = 30
        let startX = 20
        let spacingX = 30
        let spacingY = 47
        for (let playerIdx = 0; playerIdx < gs.server.players.length; playerIdx++) {
            let player: Player = gs.server.players[playerIdx]

            ctx.fillStyle = '#ffffff'
            ctx.font = '15px Arial'
            ctx.fillText(player.name, startX, startY + spacingY * playerIdx)

            for (let j = 1; j < player.health + 1; j++) {
                ctx.drawImage(heartImage, startX + spacingX * (j - 1), startY + 8 + spacingY * playerIdx, 20, 20)
            }
        }

        shieldAnimation.tick()
        controlsInvertedAnimation.tick()
    }

    function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number){
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();   
    }

    return (
        <div>
            <canvas ref={canvasRef} width="1100" height="650"></canvas>
        </div>
    )
})

export default SpaceBalls