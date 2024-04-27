import React, {useState, useEffect, useRef} from 'react'
import './App.css'
import WebSocket from 'isomorphic-ws'
import SpaceBalls from "./components/SpaceBalls"
import SpaceBallsMethods from "./components/SpaceBalls"
import GameExplanationImage from './resources/images/game_explanation.png'
import { BoundedStack } from './services/BoundedStack'
import { Player } from "./interfaces/LobbyModels"
import { SendLobbyStateToClientsDTO, ChooseNameToServerDTO, StartGameToServerDTO } from "./interfaces/DTO"

interface SpaceBallsMethods {
  onGameStateChange: (newState: string, iat: InterArrivalTime) => void
}

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
  const [players, setPlayers] = useState<Player[]>([])
  const [yourId, setYourId] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const [connectionFailed, setConnectionFailed] = useState(false)

  // Client state
  const [playerName, setPlayerName] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const spaceBallsRef = useRef<SpaceBallsMethods | null>(null)

  //Other
  let iat: InterArrivalTime = {
    current: undefined,
    average: undefined,
    lastMillis: undefined,
    timeline: new BoundedStack<number>(100)
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
              case "sendLobbyStateToClients":
                const dto: SendLobbyStateToClientsDTO = jsonObject
                setGameMode(dto.lobbyState.gameMode)
                setPlayers(dto.lobbyState.players)
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
              case "backToLobbyToServer":
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

  const chooseNameHandler = () => {
    const dto: ChooseNameToServerDTO = {
      playerId: yourId,
      chosenName: playerName,
      messageType: "chooseNameToServer"
    }
    sendMsgToWsServer(JSON.stringify(dto))
  }

  const startGameHandler = () => {
    const dto: StartGameToServerDTO = {
      messageType: "startGameToServer"
    }
    sendMsgToWsServer(JSON.stringify(dto))
    setGameStarted(true)
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
            <div className="App">
              <h1>Space balls</h1>
              <div className='lobby-explanation-wrapper'>
                <div className="lobby-gui">
                  <table>
                    <tr>
                      <th>Players</th>
                      <th>Status</th>
                    </tr>
                    {players.map(player => (
                        <tr>
                          <td>{player.name}</td>
                          <td>{player.status}</td>
                        </tr>
                    ))}
                  </table>
                  <div className="controls">
                    <input
                        id="playername-input"
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <button onClick={chooseNameHandler}>Choose name</button>
                    <button onClick={startGameHandler}>Start game</button>
                  </div>
                </div>
                <div className='game_explanation'>   
                  <img src={GameExplanationImage} alt="Game explanation image" />
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default App