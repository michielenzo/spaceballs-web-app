import React, {useState, useEffect, useRef} from 'react'
import '../css/App.css'
import '../css/Generic.css'
import WebSocket from 'isomorphic-ws'
import SpaceBalls, { SpaceBallsMethods } from "./SpaceBalls"
import { BoundedStack } from '../services/BoundedStack'
import { SendRoomStateToClientsDTO, ChooseNameToServerDTO, StartGameToServerDTO, msgTypeFromString, MsgType, RoomNotFoundToClient } from "../interfaces/DTO"
import DevConsole from './DevConsole'
import Room, { RoomHandle } from './Room'
import MainMenu from './MainMenu'
import CreateRoom from './CreateRoom'
import JoinRoom from './JoinRoom'
import { ConnectionFailed, ConnectionLost } from './ConnectionError'

interface HeartbeatCheckDTO {
  messageType: string
}

export interface InterArrivalTime {
  current: number | undefined
  average: number | undefined
  lastMillis: number | undefined
  timeline: BoundedStack<number>
}

export enum GUIState {
  MAIN_MENU,
  JOIN_ROOM,
  CREATE_ROOM,
  IN_ROOM,
  GAME_STARTED,
  CONNECTION_LOST,
  CONNECTION_FAILED
}

const HEARTBEAT_INTERVAL_MILLIS = 15000

function App() {

  // Server state
  const [gameMode, setGameMode] = useState('')
  const [yourId, setYourId] = useState('')

  // Client state
  const socketRef = useRef<WebSocket | null>(null)
  const spaceBallsRef = useRef<SpaceBallsMethods>(null)
  const roomRef = useRef<RoomHandle>(null)

  const [state, setGUIState] = useState(GUIState.IN_ROOM)

  //Other
  let iat: InterArrivalTime = {
    current: undefined,
    average: undefined,
    lastMillis: undefined,
    timeline: new BoundedStack<number>(500)
  }

  useEffect(() => {
    setupWebsocket()
  }, [])

  function setupWebsocket(){
    if (!socketRef.current || !(socketRef.current instanceof WebSocket) || socketRef.current.readyState === WebSocket.CLOSED) {
      const gameServerWssUrl = process.env.REACT_APP_GAME_SERVER_WS_URL as string
      socketRef.current = new WebSocket(gameServerWssUrl)
      const socket = socketRef.current

      if (socket instanceof WebSocket) {
        socket.onerror = (event) => {
          setGUIState(GUIState.CONNECTION_FAILED)
          console.log(event)
        }
      }

      if (socket instanceof WebSocket) {
        socket.onopen = () => {
          setGUIState(GUIState.IN_ROOM)
          heartbeat(socket)
        }
      }

      if (socket instanceof WebSocket) {
        socket.onmessage = (event) => {
          if (typeof event.data === "string") {
            const jsonObject = JSON.parse(event.data)

            switch (msgTypeFromString(jsonObject["messageType"])) {
              case MsgType.SEND_ROOM_STATE_TO_CLIENTS:
                const dto: SendRoomStateToClientsDTO = jsonObject
                setGameMode(dto.roomState.gameMode)
                if(roomRef.current) roomRef.current.setup(dto.roomState)
                setYourId(dto.yourId)
                break
              case MsgType.SEND_SPACEBALLS_GAMESTATE_TO_CLIENTS:
                if (state != GUIState.GAME_STARTED) { 
                  setGUIState(GUIState.GAME_STARTED) 
                }

                calculateInterArrivalTime()

                if (spaceBallsRef.current) {
                  if ("onGameStateChange" in spaceBallsRef.current) {
                    spaceBallsRef.current.onGameStateChange(event.data, iat)
                  }
                }

                break
              case MsgType.ROOM_NOT_FOUND_TO_CLIENT:
                const dtoRoomNotFound: RoomNotFoundToClient = jsonObject
                alert("Room with code: " + dtoRoomNotFound.roomCode + "not found.")
                console.log("Room not found!!")
                break  
              case MsgType.BACK_TO_ROOM_TO_CLIENT:
                setGUIState(GUIState.IN_ROOM)
                break
              case MsgType.HEARTBEAT_ACKNOWLEDGE:
                heartbeat(socket)
                break
            }
          } else {
            console.error("Websocket message is not of type string.")
          }
        }
      }

      if (socket instanceof WebSocket) {
        socket.onclose = () => {
          console.log('WebSocket disconnected')
          setGUIState(GUIState.CONNECTION_LOST)
        }
      }
    }
  }

  function calculateInterArrivalTime(){
    let currentMillis: number = Date.now()

    if(iat.lastMillis !== undefined) {                 
      iat.current = currentMillis - iat.lastMillis 
      iat.timeline.push(iat.current)
      iat.average = iat.timeline.get()
        .reduce((acc, val) => acc + val, 0) / iat.timeline.size() 
    }

    iat.lastMillis = currentMillis    
  }

  function heartbeat (socket: WebSocket){
    const dto: HeartbeatCheckDTO = {
      messageType: MsgType.HEARTBEAT_CHECK.toString()
    }

    setTimeout(() => {
      socket?.send(JSON.stringify(dto), (err) => {
        if (err){
          setGUIState(GUIState.CONNECTION_LOST)
          console.log(err)
        }
      })
    }, HEARTBEAT_INTERVAL_MILLIS)
  }

  function sendMsgToWsServer(message: string) {
    if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
      if (socketRef.current instanceof WebSocket) {
        socketRef.current.send(message)
      }
    } else {
      console.error('WebSocket is not open. Message not sent.')
    }
  }

  return (
      <div className="App">
        { state === GUIState.GAME_STARTED ? (
            <SpaceBalls socketRef={socketRef} yourId={yourId} ref={spaceBallsRef} />
        ) : state === GUIState.CONNECTION_FAILED ? (
           <ConnectionFailed />
        ) : state === GUIState.CONNECTION_LOST ? (
           <ConnectionLost />
        ) : state === GUIState.IN_ROOM ? (
          <Room
            ref={roomRef} yourId={yourId}
            sendMsgToWsServer={sendMsgToWsServer} setGUIState={setGUIState}
          />
        ) : state === GUIState.JOIN_ROOM ? (
           <JoinRoom setGUIState={setGUIState} sendMsgToWsServer={sendMsgToWsServer} /> 
        ) : state === GUIState.CREATE_ROOM ? (
           <CreateRoom setGUIState={setGUIState} sendMsgToWsServer={sendMsgToWsServer} /> 
        ) : (
           <MainMenu setGUIState={setGUIState} /> 
        )}

        <DevConsole />
      </div>
  )
}

export default App