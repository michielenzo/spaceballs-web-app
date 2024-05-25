import React, {useState, useEffect, useRef} from 'react'
import '../css/App.css'
import WebSocket from 'isomorphic-ws'
import SpaceBalls, { SpaceBallsMethods } from "./SpaceBalls"
import { BoundedStack } from '../services/BoundedStack'
import { SendRoomStateToClientsDTO, ChooseNameToServerDTO, StartGameToServerDTO } from "../interfaces/DTO"
import DevConsole from './DevConsole'
import Room, { RoomHandle } from './Room'

interface HeartbeatCheckDTO {
  messageType: string
}

export interface InterArrivalTime {
  current: number | undefined
  average: number | undefined
  lastMillis: number | undefined
  timeline: BoundedStack<number>
}

const HEARTBEAT_INTERVAL_MILLIS = 15000

function App() {

  // Server state
  const [gameMode, setGameMode] = useState('')
  const [yourId, setYourId] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const [connectionFailed, setConnectionFailed] = useState(false)

  // Client state
  const socketRef = useRef<WebSocket | null>(null)
  const spaceBallsRef = useRef<SpaceBallsMethods>(null)
  const roomRef = useRef<RoomHandle>(null)

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
      console.log(process.env.NODE_ENV)
      const gameServerWssUrl = process.env.REACT_APP_GAME_SERVER_WS_URL as string
      socketRef.current = new WebSocket(gameServerWssUrl)
      const socket = socketRef.current

      if (socket instanceof WebSocket) {
        socket.onerror = (event) => {
          setConnectionFailed(true)
          setConnectionLost(false)
          console.log(event)
        }
      }

      if (socket instanceof WebSocket) {
        socket.onopen = () => {
          setConnectionLost(false)
          setConnectionFailed(false)
          heartbeat(socket)
        }
      }

      if (socket instanceof WebSocket) {
        socket.onmessage = (event) => {
          if (typeof event.data === "string") {
            const jsonObject = JSON.parse(event.data)

            switch (jsonObject["messageType"]) {
              case "sendRoomStateToClients":
                const dto: SendRoomStateToClientsDTO = jsonObject
                setGameMode(dto.roomState.gameMode)
                if(roomRef.current) roomRef.current.setPlayers(dto.roomState.players)
                setYourId(dto.yourId)
                break
              case "sendSpaceBallsGameStateToClients":
                if (!gameStarted) { setGameStarted(true) }

                calculateInterArrivalTime()

                if (spaceBallsRef.current) {
                  if ("onGameStateChange" in spaceBallsRef.current) {
                    spaceBallsRef.current.onGameStateChange(event.data, iat)
                  }
                }

                break
              case "backToRoomToClient":
                setGameStarted(false)
                break
              case "heartbeatAcknowledge":
                heartbeat(socket)
                break
            }
          } else {
            console.error("Websocket message is not of type String.")
          }
        }
      }

      if (socket instanceof WebSocket) {
        socket.onclose = () => {
          console.log('WebSocket disconnected')
          setConnectionLost(true)
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
      messageType: "heartbeatCheck"
    }

    setTimeout(() => {
      socket?.send(JSON.stringify(dto), (err) => {
        if (err){
          setConnectionLost(true)
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
        {gameStarted ? (
            <SpaceBalls socketRef={socketRef} yourId={yourId} ref={spaceBallsRef} />
        ): connectionFailed ? (
            <div className="connection-failed">
              <h1>Could not connect to the server.</h1>
              <p>Refresh the page, or try again later if the problem persists.</p>
            </div>
        ) : connectionLost ? (
            <div className="connection-lost">
              <h1>Connection to the server is lost.</h1>
              <p>Refresh the page to reestablish.</p>
            </div>
        ) : (
          <Room
            ref={roomRef} yourId={yourId}
            sendMsgToWsServer={sendMsgToWsServer} setGameStarted={setGameStarted}
          />
        )}
        <DevConsole />
      </div>
  )
}

export default App