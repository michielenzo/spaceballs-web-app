import React, {useState, useEffect, useRef} from 'react'
import './App.css'
import WebSocket from 'isomorphic-ws'
import SpaceBalls from "./components/SpaceBalls";
import SpaceBallsMethods from "./components/SpaceBalls"

interface Player {
  id: string
  name: string
  status: string
}

interface LobbyState {
  gameMode: string
  players: Player[]
}

interface SendLobbyStateToClientsDTO {
  lobbyState: LobbyState,
  yourId: string,
  messageType: string
}

interface ChooseNameToServerDTO {
  playerId: string,
  chosenName: string,
  messageType: string
}

interface StartGameToServerDTO {
  messageType: string
}

interface SpaceBallsMethods {
  onGameStateChange: (newState: string) => void;
}

function App() {

  // Server state
  const [gameMode, setGameMode] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [messageType, setMessageType] = useState('')
  const [yourId, setYourId] = useState('')
  const [gameStarted, setGameStarted] = useState(false);

  // Client state
  const [playerName, setPlayerName] = useState('')

  const socketRef = useRef<WebSocket | null>(null)

  const spaceBallsRef = useRef<SpaceBallsMethods>(null);

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
      // socketRef.current = new WebSocket('ws://localhost:8080/player')
      socketRef.current = new WebSocket('ws://81.0.249.1:8080/player')
      const socket = socketRef.current

      socket.onopen = () => console.log('WebSocket connected')

      socket.onmessage = (event) => {
        if (typeof event.data === "string") {
          const jsonObject = JSON.parse(event.data)

          switch(jsonObject["messageType"]){
            case "sendLobbyStateToClients":
              const dto: SendLobbyStateToClientsDTO = jsonObject
              setGameMode(dto.lobbyState.gameMode)
              setPlayers(dto.lobbyState.players)
              setMessageType(dto.messageType)
              setYourId(dto.yourId)
              break;
            case "sendSpaceBallsGameStateToClients":
              if (spaceBallsRef.current) {
                spaceBallsRef.current.onGameStateChange(event.data);
              }
              break;
          }
        } else {
          console.error("Websocket message is not of type String.")
        }
      }

      socket.onclose = () => console.log('WebSocket disconnected')
    }
  }, [])

  const chooseNameHandler = () => {
    const dto: ChooseNameToServerDTO = {
      playerId: yourId,
      chosenName: playerName,
      messageType: "chooseNameToServer"
    };
    sendMsgToWsServer(JSON.stringify(dto))
  }

  const startGameHandler = () => {
    const dto: StartGameToServerDTO = {
      messageType: "startGameToServer"
    }
    sendMsgToWsServer(JSON.stringify(dto))
    setGameStarted(true)
  };

  function sendMsgToWsServer(message: string) {
    if(socketRef.current && socketRef.current?.readyState === WebSocket.OPEN){
      console.log("Sending message.")
      socketRef.current.send(message)
    } else {
      console.error('WebSocket is not open. Message not sent.')
    }
  }

  return (
      <div className="App">
        {gameStarted ? (
            <SpaceBalls socketRef={socketRef} yourId={yourId} ref={spaceBallsRef} />
        ) : (
            <div className="App">
              <h1>Space balls</h1>
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
            </div>
        )}
      </div>
  );
}

export default App;
