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
  const [yourId, setYourId] = useState('')
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  // Client state
  const [playerName, setPlayerName] = useState('')

  const socketRef = useRef<WebSocket | null>(null)

  const spaceBallsRef = useRef<SpaceBallsMethods>(null);

  useEffect(() => {
    setupWebsocket()
  }, [])

  function setupWebsocket(){
    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
      const gameServerWssUrl = process.env.REACT_APP_GAME_SERVER_WS_URL as string;
      socketRef.current = new WebSocket(gameServerWssUrl)
      const socket = socketRef.current

      socket.onerror = (event) => {
        console.log(event)
      }

      socket.onopen = () => {
        console.log('WebSocket connected')
        setConnectionTimedOut(false)
      }

      socket.onmessage = (event) => {
        if (typeof event.data === "string") {
          const jsonObject = JSON.parse(event.data)

          switch(jsonObject["messageType"]){
            case "sendLobbyStateToClients":
              const dto: SendLobbyStateToClientsDTO = jsonObject
              setGameMode(dto.lobbyState.gameMode)
              setPlayers(dto.lobbyState.players)
              setYourId(dto.yourId)
              break;
            case "sendSpaceBallsGameStateToClients":
              if(!gameStarted) setGameStarted(true)
              if (spaceBallsRef.current) {
                spaceBallsRef.current.onGameStateChange(event.data);
              }
              break;
            case "backToLobbyToServer":
              setGameStarted(false)
              break
            case "":

          }
        } else {
          console.error("Websocket message is not of type String.")
        }
      }

      socket.onclose = () => {
        console.log('WebSocket disconnected')
        setConnectionTimedOut(true)
      }
    }
  }

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
      socketRef.current.send(message)
    } else {
      console.error('WebSocket is not open. Message not sent.')
    }
  }

  return (
      <div className="App">
        {gameStarted ? (
            <SpaceBalls socketRef={socketRef} yourId={yourId} ref={spaceBallsRef} />
        ) : connectionTimedOut ? (
            <div className="connection-timeout">
              <h1>Connection Timed Out</h1>
              <p>Refresh the page to reestablish.</p>
            </div>
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
