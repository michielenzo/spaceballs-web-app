import { LobbyState } from "./LobbyModels"

export interface SendLobbyStateToClientsDTO {
  lobbyState: LobbyState,
  yourId: string,
  messageType: string
}

export interface ChooseNameToServerDTO {
  playerId: string,
  chosenName: string,
  messageType: string
}

export interface StartGameToServerDTO {
  messageType: string
}
