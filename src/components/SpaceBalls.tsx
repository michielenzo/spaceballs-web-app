import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import WebSocket from 'isomorphic-ws';
import ArrowsImage from '../resources/images/arrows.png'
import HeartImage from '../resources/images/heart.jpg'
import MedKitImage from '../resources/images/medkit.png'
import RssShieldImage from '../resources/images/rsshield.png'
import SkullImage from '../resources/images/skull.png'

// Component config
interface SpaceBallsProps {
    socketRef: React.MutableRefObject<WebSocket | null>;
    yourId: string;
}

interface SpaceBallsMethods {
    onGameStateChange: (newState: string) => void;
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
}

interface Player {
    sessionId: string
    name: string
    x: number
    y: number
    health: number
    shield: boolean
}

interface FireBall {
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

// Use forwardRef to allow refs to be forwarded to this component
const SpaceBalls = forwardRef<SpaceBallsMethods, SpaceBallsProps>((props, ref) => {

    const { socketRef, yourId } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const init : InputState = { wKey: false, aKey: false, sKey: false, dKey: false }
    const inputState = useRef<InputState>(init)

    let medKitImage = new Image()
    let inverterImage = new Image()
    let shieldImage = new Image()
    const heartImage = new Image()
    const skullImage = new Image()

    const powerUpWidth: number = 40
    const powerUpHeight: number = 40
    const playerWidth: number = 50
    const playerHeight: number = 50
    const fireBallDiameter: number = 50

    // Use useImperativeHandle to expose specific functions to parent Components.
    useImperativeHandle(ref, () => ({
        onGameStateChange(newState: string) {
            const dto: SendSpaceBallsGameStateToClientsDTO = JSON.parse(newState)
            console.log(dto)

            if (canvasRef.current){
                const ctx = canvasRef.current.getContext('2d');
                if(ctx){
                    render(ctx, canvasRef.current, dto)
                }
            }
        }
    }));

    useEffect(() => {
        setupKeyboardInput()
        setupImages()
    }, [])

    function setupImages(){
        medKitImage.src = MedKitImage
        inverterImage.src = ArrowsImage
        shieldImage.src = RssShieldImage
        heartImage.src = HeartImage
        skullImage.src = SkullImage
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
            console.log(event)
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
            socketRef.current.send(JSON.stringify(dto))
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    function sendInputStateToServer() {
        let dto: SendInputStateToServerDTO = {
            sessionId: yourId, messageType: "sendInputStateToServer",
            wKey: inputState.current.wKey, aKey: inputState.current.aKey,
            sKey: inputState.current.sKey, dKey: inputState.current.dKey
        }

        if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
            socketRef.current.send(JSON.stringify(dto))
        } else { console.error('WebSocket is not open. Message not sent.') }
    }

    function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dto: SendSpaceBallsGameStateToClientsDTO){
        // Resetting the sources every frame fixes a bug where images are unloaded when a player leaves.
        // It does not seem to impact performance in a significant way.
        setupImages()

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render HUD
        let startY = 30
        let startX = 20
        let spacingX = 30
        let spacingY = 47
        for (let playerIdx = 0; playerIdx < dto.gameState.players.length; playerIdx++) {
            let player: Player = dto.gameState.players[playerIdx]

            ctx.fillStyle = '#ffffff'
            ctx.font = '15px Arial'
            ctx.fillText(player.name, startX, startY + spacingY * playerIdx)

            for (let j = 1; j < player.health + 1; j++) {
                ctx.drawImage(heartImage, startX + spacingX * (j - 1), startY + 8 + spacingY * playerIdx, 20, 20)
            }
        }

        // Render players
        dto.gameState.players.forEach((player) => {
            ctx.fillStyle = '#ffffff'
            ctx.font = '17px Arial'
            ctx.fillText(player.name, player.x, player.y - 12)

            if(player.health > 0){
                ctx.fillStyle = '#8a2be2'
                ctx.fillRect(player.x, player.y, playerWidth, playerHeight)
                if(player.shield) {
                    ctx.drawImage(shieldImage, player.x - 5, player.y - 5, playerWidth + 10, playerHeight + 10)
                }
            } else if (player.health === 0) {
                ctx.drawImage(skullImage, player.x, player.y, playerWidth, playerHeight)
            }
        })

        // Render powerUps
        dto.gameState.powerUps.forEach((powerUp) => {
            switch (powerUp.type) {
                case "inverter":
                    ctx.drawImage(inverterImage, powerUp.x , powerUp.y, powerUpWidth, powerUpHeight)
                    break
                case "med_kit":
                    ctx.drawImage(medKitImage, powerUp.x , powerUp.y, powerUpWidth, powerUpHeight)
                    break
                case "shield":
                    ctx.drawImage(shieldImage, powerUp.x , powerUp.y, powerUpWidth, powerUpHeight)
                    break
            }
        })

        // Render fireBalls
        dto.gameState.fireBalls.forEach((ball) => {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, fireBallDiameter / 2, 0, Math.PI * 2);
            ctx.fill();
        })
    }

    return (
        <div>
            <canvas ref={canvasRef} width="1100" height="700"></canvas>
        </div>
    );
});

export default SpaceBalls;