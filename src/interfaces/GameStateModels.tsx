export interface GameState {
    players: Player[]
    fireBalls: FireBall[]
    powerUps: PowerUp[]
    homingBalls: HomingBall[]
}

export interface GameObject{
    id: number
    x: number,
    y: number
}

export interface Player extends GameObject{
    sessionId: string
    name: string
    health: number
    shield: boolean
    inverted: boolean
}

export interface HomingBall extends GameObject {}

export interface FireBall extends GameObject{}

export interface PowerUp extends GameObject {
    type: string
}