import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Player, RoomState } from '../interfaces/RoomModels'
import '../css/Generic.css'
import '../css/Room.css'
import { ChooseNameToServerDTO, JoinRoomToServerDTO, KickPlayerToServer, MsgType, PromotePlayerToServer, StartGameToServerDTO } from '../interfaces/DTO'
import GameExplanationImage from '../resources/images/game_explanation.png'
import { GUIState } from './App'
import ErrorPopup from './ErrorPopup'

interface RoomProps {
  sendMsgToWsServer: (message: string) => void
  setGUIState: (value: GUIState) => void
  yourId: string
}

export interface RoomHandle {
  setup: (roomState: RoomState) => void
  showRoomNotFoundHandle: () => void
}

const Room = forwardRef<RoomHandle, RoomProps>(({ sendMsgToWsServer, setGUIState, yourId }, ref) => {

  const [players, setPlayers] = useState<Player[]>([])
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState<string>("")
  const [joinRoomCode, setJoinRoomCode] = useState<string>("")
  const [showError, setShowError] = useState(false)
  const [leaderId, setLeaderId] = useState("")

  useImperativeHandle(ref, () => ({
    setup(roomState: RoomState){
      setPlayers(roomState.players)
      setRoomCode(roomState.roomCode)
      setLeaderId(roomState.leaderId)
    },
    showRoomNotFoundHandle() {
      setShowError(true)
      setTimeout(() => {
        setShowError(false)
      }, 3000)
    }
  }))

  const chooseNameHandler = () => {
    const dto: ChooseNameToServerDTO = {
      playerId: yourId,
      chosenName: playerName,
      messageType: 'chooseNameToServer'
    }
    sendMsgToWsServer(JSON.stringify(dto))
  }

  const startGameHandler = () => {
    const dto: StartGameToServerDTO = {
      playerId: yourId,
      messageType: 'startGameToServer'
    }
    sendMsgToWsServer(JSON.stringify(dto))
    setGUIState(GUIState.GAME_STARTED)
  }

  const joinRoomByCode = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const dto: JoinRoomToServerDTO = {
        playerName: playerName,
        playerId: yourId,
        messageType: MsgType.JOIN_ROOM_TO_SERVER,
        roomCode: joinRoomCode
      }

      sendMsgToWsServer(JSON.stringify(dto))
    }
  }

  const kickPlayerHandler = (playerId: string) => {
    const dto: KickPlayerToServer = {
      playerId: yourId,
      playerToKickId: playerId,
      messageType: MsgType.KICK_PLAYER_TO_SERVER
    }
    
    sendMsgToWsServer(JSON.stringify(dto))
  }

  const promotePlayerHandler = (playerId: string) => {
    const dto: PromotePlayerToServer = {
      playerId: yourId,
      playerToPromoteId: playerId,
      messageType: MsgType.PROMOTE_PLAYER_TO_SERVER
    }

    sendMsgToWsServer(JSON.stringify(dto))   
  }

  return (
    <div className='App'>
      <div id='header-wrapper'>
        <h1 className='form-box'>Space balls</h1>
        <div id='room-code-wrapper'>
          <h2 id='room-code-header' className='form-box'><i>Room Code:</i> <span>{roomCode}</span></h2>
          <div id='join-by-code-wrapper' className='form-box'>
            <h3>JOIN</h3>
            <input type='text' maxLength={5}
                   onKeyDown={joinRoomByCode} value={joinRoomCode}
                   onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())} />
          </div>
        </div>
        {showError && <ErrorPopup message="Room not found." />}
      </div>

      <div className='room-explanation-wrapper'>
        <div className='room-gui'>
          <table>
            <thead>
              <tr>
                <th>Players</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  <td>
                    <span className={player.id === yourId ? 'bold' : ''}>{player.name}</span>
                    <span className={player.id === yourId ? 'bold secondary' : 'secondary'} hidden={leaderId !== player.id}><i> | Leader</i></span>
                  </td>
                  <td className={player.id === yourId ? 'bold' : ''}>{player.status}</td>
                  <td className='other-column'>
                    <button id='kick-btn' onClick={(e) => kickPlayerHandler(player.id)} 
                            disabled={leaderId !== yourId}
                            hidden={player.id === yourId}>Kick</button>
                    <button id='promote-btn' onClick={(e) => promotePlayerHandler(player.id)}
                            disabled={leaderId !== yourId}
                            hidden={player.id === yourId}>Promote</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='controls'>
            <input
              id='playername-input'
              type='text'
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button onClick={chooseNameHandler}>Choose name</button>
            <button onClick={startGameHandler}>Start game</button>
          </div>
        </div>
        <div className='game_explanation'>
          <img src={GameExplanationImage} alt='Game explanation image' />
        </div>
      </div>
    </div>
  )
})

export default Room
