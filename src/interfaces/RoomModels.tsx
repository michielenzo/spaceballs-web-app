export interface Player {
    id: string
    name: string
    status: string
}

export interface RoomState {
    gameMode: string
    roomCode: string
    players: Player[]
}