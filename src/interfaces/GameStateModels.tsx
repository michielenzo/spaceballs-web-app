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
    SHIELD_PICKUP = "SHIELD_PICKUP",
    PLAYER_DIED = "PLAYER_DIED",
    MEDKIT_PICKUP = "MEDKIT_PICKUP",
    PICKUP_CONTROL_INVERTER = "PICKUP_CONTROL_INVERTER",
    START_CONTROLS_INVERTED = "START_CONTROLS_INVERTED",
    INVERTER_PICKUP = "INVERTER_PICKUP",
    WINNER_DECIDED = "WINNER_DECIDED",
}

export interface GameEvent {
    type: string,
    data: Record<string, string>
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