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
  ROOM_NOT_FOUND_TO_CLIENT = "roomNotFoundToClient",
  KICK_PLAYER_TO_SERVER = "kickPlayerToServer",
  PROMOTE_PLAYER_TO_SERVER = "promotePlayerToServer",
  YOU_HAVE_BEEN_KICKED_TO_CLIENT = "youHaveBeenKickedToClient",
  READY_UP_TO_SERVER = "readyUpToServer",
  NOT_READY_TO_SERVER = "notReadyToServer",
  GAME_CONFIG_TO_CLIENTS = "gameConfigToClients",
}

export interface DTO {
  messageType: string
}

export interface GameConfigToClientsDTO extends DTO {
  powerUpWidth: number
  powerUpHeight: number
  playerWidth: number
  playerHeight: number
  homingBallRadius: number
  meteoriteDiameter: number
  playerSpeed: number
}

export interface ReadyUpToServerDTO extends DTO {
  playerId: string
}

export interface NotReadyToServerDTO extends DTO {
  playerId: string
}

export interface PromotePlayerToServerDTO extends DTO {
  playerId: string
  playerToPromoteId: string
}

export interface KickPlayerToServerDTO extends DTO {
  playerId: string
  playerToKickId: string
}

export interface RoomNotFoundToClientDTO extends DTO {
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