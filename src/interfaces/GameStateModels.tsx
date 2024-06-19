export interface GameState {
    players: Player[]
    meteorites: Meteorite[]
    powerUps: PowerUp[]
    homingBalls: HomingBall[]
    events: GameEvent[]
}

export interface GameObject {
    id: number
    x: number,
    y: number
}

export enum GameEventType {
    METEORITES_UNFREEZE = "METEORITES_UNFREEZE",
    PLAYER_METEORITE_COLLISION = "PLAYER_METEORITE_COLLISION",
}

export interface GameEvent {
    type: string,
    data: Map<string, string>
}

export interface Player extends GameObject {
    sessionId: string
    name: string
    health: number
    shield: boolean
    inverted: boolean
}

export interface HomingBall extends GameObject {}

export interface Meteorite extends GameObject {}

export interface PowerUp extends GameObject {
    type: string
}