export enum PlayerStatus {
    READY = "ready",
    AVAILABLE = "available",
    IN_GAME = "in game",
}

export interface Player {
    id: string
    name: string
    status: string
}

export interface RoomState {
    gameMode: string
    roomCode: string
    leaderId: string
    players: Player[]
}

export interface ServerRoomsState {
    roomsData: RoomState[]
}