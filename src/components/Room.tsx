import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { Player } from '../interfaces/RoomModels'
import { ChooseNameToServerDTO, StartGameToServerDTO } from '../interfaces/DTO'
import GameExplanationImage from '../resources/images/game_explanation.png'

interface RoomProps {
  sendMsgToWsServer: (message: string) => void
  setGameStarted: (value: boolean) => void
  yourId: string
}

export interface RoomHandle {
  setPlayers: (players: Player[]) => void
}

const Room = forwardRef<RoomHandle, RoomProps>(({ sendMsgToWsServer, setGameStarted, yourId }, ref) => {

  const [players, setPlayers] = useState<Player[]>([])
  const [playerName, setPlayerName] = useState('')

  useImperativeHandle(ref, () => ({
    setPlayers(newPlayers: Player[]) {
      setPlayers(newPlayers)
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
      messageType: 'startGameToServer'
    }
    sendMsgToWsServer(JSON.stringify(dto))
    setGameStarted(true)
  }

  return (
    <div className='App'>
      <h1>Space balls</h1>
      <div className='room-explanation-wrapper'>
        <div className='room-gui'>
          <table>
            <thead>
              <tr>
                <th>Players</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.status}</td>
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
