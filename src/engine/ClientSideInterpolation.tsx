import { InterArrivalTime } from "../components/App"
import { GameStates } from "../components/SpaceBalls"
import { GameState } from "../interfaces/GameStateModels"
import { GameObject } from "../interfaces/GameStateModels"
import { deepCopy } from "../utility/Other"
import { Vec2D } from "../utility/math"

// Interpolate certain gameobjects between gs.previous and gs.server
export function interpolateGamestate_FactorTranslation(
    iat: InterArrivalTime,
    gs: GameStates
) {
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
    interpolateObjects(gs.previous.meteorites, gs.server.meteorites, gs.interpolated.meteorites)
    interpolateObjects(gs.previous.players, gs.server.players, gs.interpolated.players)
    interpolateObjects(gs.previous.homingBalls, gs.server.homingBalls, gs.interpolated.homingBalls)
}

export function interpolateGameState_RawTranslation(
    gsInterpolated: GameState,
    IFTMapping: Map<number, Vec2D>
) {
    const interpolatedObjects: GameObject[] = [
        ...gsInterpolated.meteorites, 
        ...gsInterpolated.homingBalls, 
        ...gsInterpolated.players
    ]

    interpolatedObjects.forEach(obj => {
        let IFTMatch: Vec2D | undefined = IFTMapping.get(obj.id)

        if(!IFTMatch) {
            return
        }

        obj.x += IFTMatch.x
        obj.y += IFTMatch.y
    })
}

// Math / Pseudocode for better CSI with RawTranslation strategy.
// interpolationFrameTranslation X,Y = Dist(gs.I -> gs.S) / AvgInterpolationFrames
// AvgInterpolationFrames = iat.average / AvgInterpolationFrameDuration
// AvgInterpolationFrameDuration = 1000 / FPS 
export function prepareInterpolation_RawTranslation(
    gsServer: GameState,
    gsInterpolated: GameState,
    iat: InterArrivalTime,
    IFTMapping: Map<number, Vec2D>,
    fps: number
){
    let newGSWithoutPositionUpdates = deepCopy(gsServer)
    const newGSObjs: GameObject[] = [
        ...newGSWithoutPositionUpdates.meteorites, 
        ...newGSWithoutPositionUpdates.homingBalls, 
        ...newGSWithoutPositionUpdates.players
    ]
    const newGSObjsMap = new Map(newGSObjs.map(obj => [obj.id, obj]))

    if (!iat.average || !iat.lastMillis || !gsServer) return

    let avgInterpolationFrameDuration: number = 1000 / fps
    let avgInterpolationFrames: number = iat.average / avgInterpolationFrameDuration

    function calculateIFT<T extends GameObject>(interpolatedObjects: T[], serverObjects: T[]){
        const serverMap = new Map(serverObjects.map(obj => [obj.id, obj]))

        interpolatedObjects.forEach(interpolatedObj => {
            // Keep the old positions 
            const newGSMatch = newGSObjsMap.get(interpolatedObj.id)
            if(!newGSMatch) return
            newGSMatch.x = interpolatedObj.x
            newGSMatch.y = interpolatedObj.y
            
            const serverObjMatch = serverMap.get(interpolatedObj.id)
            if(!serverObjMatch) return

            const distX = serverObjMatch.x - interpolatedObj.x
            const distY = serverObjMatch.y - interpolatedObj.y
            const translationX = distX / avgInterpolationFrames
            const translationY = distY / avgInterpolationFrames

            IFTMapping.set(interpolatedObj.id, { x: translationX, y: translationY })
        })
    }

    calculateIFT(gsInterpolated.meteorites, gsServer.meteorites)
    calculateIFT(gsInterpolated.homingBalls, gsServer.homingBalls)
    calculateIFT(gsInterpolated.players, gsServer.players)

    gsInterpolated = newGSWithoutPositionUpdates
}