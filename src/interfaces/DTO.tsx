import { RoomState } from "./RoomModels"
import { GameState } from "./GameStateModels"

export interface SendRoomStateToClientsDTO {
  roomState: RoomState,
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

export interface SendInputStateToServerDTO {
  wKey: boolean
  aKey: boolean
  sKey: boolean
  dKey: boolean
  messageType: "sendInputStateToServer"
  sessionId: string
}

export interface BackToRoomToServerDTO {
  playerId: string
  messageType: "backToRoomToServer"
}

export interface SendSpaceBallsGameStateToClientsDTO {
  gameState: GameState
  messageType: string
}