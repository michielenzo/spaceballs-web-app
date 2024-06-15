import { InputState } from "../components/SpaceBalls"
import { GameState, Player } from "../interfaces/GameStateModels"


export function prepareCSP(predictedGs: GameState, serverGs: GameState, yourId: string){
    const yourServerPlayer: Player | undefined = serverGs.players.find(p => p.sessionId === yourId)
    const yourPredictedPlayer: Player | undefined = predictedGs.players.find(p => p.sessionId === yourId)

    if (yourServerPlayer && yourPredictedPlayer) {
        yourPredictedPlayer.health = yourServerPlayer.health
        yourPredictedPlayer.inverted = yourServerPlayer.inverted
        yourPredictedPlayer.shield = yourServerPlayer.shield

        // Calculate discrepancy
        const discrepancyX = yourPredictedPlayer.x - yourServerPlayer.x
        const discrepancyY = yourPredictedPlayer.y - yourServerPlayer.y

        // Apply correction
        const correctionFactor = 0.05
        yourPredictedPlayer.x -= discrepancyX * correctionFactor
        yourPredictedPlayer.y -= discrepancyY * correctionFactor
    }
}

export function applyCSP(
    predictedGs: GameState, 
    yourId: string, 
    inputState: InputState,
    speedFactor: number,
    canvasWidth: number,
    canvasHeight: number,
    playerWidth: number,
    playerHeight: number,
    playerSpeed: number
){
    const predictedPlayer = predictedGs.players.filter(p => p.sessionId === yourId).at(0)

    if(predictedPlayer && predictedPlayer.health > 0){
        // Move player
        let translationX = 0
        let translationY = 0
        let speed = playerSpeed * speedFactor
        if(predictedPlayer.inverted) speed = -speed

        if(inputState.wKey) translationY -= speed
        if(inputState.aKey) translationX -= speed
        if(inputState.sKey) translationY += speed
        if(inputState.dKey) translationX += speed

        predictedPlayer.x += translationX
        predictedPlayer.y += translationY

        // Wall collision
        if(predictedPlayer.x < 0) predictedPlayer.x = 0
        if(predictedPlayer.x > canvasWidth - playerWidth) predictedPlayer.x = canvasWidth - playerWidth
        if(predictedPlayer.y < 0) predictedPlayer.y = 0
        if(predictedPlayer.y > canvasHeight - playerHeight) predictedPlayer.y = canvasHeight - playerHeight
    }
}