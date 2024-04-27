export interface Player {
    id: string
    name: string
    status: string
}

export interface LobbyState {
    gameMode: string
    players: Player[]
}