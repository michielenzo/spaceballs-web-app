import { LobbyState } from "./LobbyModels"
import { GameState } from "./GameStateModels"

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

interface SendSpaceBallsGameStateToClientsDTO {
  gameState: GameState
  messageType: string
}