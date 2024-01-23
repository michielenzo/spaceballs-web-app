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
    xPosition: number
    yPosition: number
    health: number
    hasShield: boolean
    width: number
    height: number
}

interface FireBall {
    xPosition: number
    yPosition: number
    diameter: number
}

interface PowerUp {
    type: string
    xPosition: number
    yPosition: number
    width: number
    height: number
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

    // Use useImperativeHandle to expose specific functions to parent Components.
    useImperativeHandle(ref, () => ({
        onGameStateChange(newState: string) {
            const dto: SendSpaceBallsGameStateToClientsDTO = JSON.parse(newState)

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
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        dto.gameState.players.forEach((player) => {
            ctx.fillStyle = '#ffffff'
            ctx.font = '17px Arial'
            ctx.fillText(player.name, player.xPosition, player.yPosition - 12)

            if(player.health > 0){
                ctx.fillStyle = '#8a2be2'
                ctx.fillRect(player.xPosition, player.yPosition, player.width, player.height)
                if(player.hasShield) {
                    ctx.drawImage(shieldImage, player.xPosition - 5, player.yPosition - 5, player.width + 10, player.height + 10)
                }
            } else if (player.health === 0) {
                ctx.drawImage(skullImage, player.xPosition, player.yPosition, player.width, player.height)
            }
        })

        dto.gameState.powerUps.forEach((powerUp) => {
            switch (powerUp.type) {
                case "inverter":
                    ctx.drawImage(inverterImage, powerUp.xPosition , powerUp.yPosition, powerUp.width, powerUp.height)
                    break
                case "med_kit":
                    ctx.drawImage(medKitImage, powerUp.xPosition , powerUp.yPosition, powerUp.width, powerUp.height)
                    break
                case "shield":
                    ctx.drawImage(shieldImage, powerUp.xPosition , powerUp.yPosition, powerUp.width, powerUp.height)
                    break
            }
        })

        dto.gameState.fireBalls.forEach((ball) => {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(ball.xPosition, ball.yPosition, ball.diameter / 2, 0, Math.PI * 2);
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