import { RoomState } from "./RoomModels"
import { GameState } from "./GameStateModels"

export const msgTypeFromString = (value: string): MsgType | undefined => {
  return (Object.values(MsgType) as Array<string>).includes(value) ? (value as MsgType) : undefined
}

export enum MsgType {
  SEND_ROOM_STATE_TO_CLIENTS = "sendRoomStateToClients",
  SEND_SPACEBALLS_GAMESTATE_TO_CLIENTS = "sendSpaceBallsGameStateToClients",
  BACK_TO_ROOM_TO_CLIENT = "backToRoomToClient",
  HEARTBEAT_ACKNOWLEDGE = "heartbeatAcknowledge",
  HEARTBEAT_CHECK = "heartbeatCheck",
  SEND_INPUT_STATE_TO_SERVER = "sendInputStateToServer",
  BACK_TO_ROOM_TO_SERVER = "backToRoomToServer",
  CREATE_ROOM_TO_SERVER = "createRoomToServer",
  JOIN_ROOM_TO_SERVER = "joinRoomToServer",
  REFRESH_ROOMS_OVERVIEW_TO_SERVER = "refreshRoomsOverviewToServer",
  ROOM_NOT_FOUND_TO_CLIENT = "roomNotFoundToClient"
}

export interface DTO {
  messageType: string
}

export interface RoomNotFoundToClient extends DTO {
  playerId: string
  roomCode: string
}

export interface RefreshRoomsOverviewToServer extends DTO {}

export interface JoinRoomToServerDTO extends DTO {
  playerId: string
  playerName: string
  roomCode: string
}

export interface CreateRoomToServerDTO extends DTO {
  roomName: string,
  playerName: string,
  isPrivate: boolean,
  maxPlayers: number
}

export interface SendRoomStateToClientsDTO extends DTO  {
  roomState: RoomState,
  yourId: string,
}

export interface ChooseNameToServerDTO extends DTO  {
  playerId: string,
  chosenName: string,
}

export interface StartGameToServerDTO extends DTO {
  playerId: string
}

export interface SendInputStateToServerDTO extends DTO  {
  wKey: boolean
  aKey: boolean
  sKey: boolean
  dKey: boolean
  sessionId: string
}

export interface BackToRoomToServerDTO extends DTO  {
  playerId: string
}

export interface SendSpaceBallsGameStateToClientsDTO extends DTO  {
  gameState: GameState
}