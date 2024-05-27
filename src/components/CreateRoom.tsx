import { GUIState } from "./App";
import '../css/Generic.css'
import '../css/CreateRoom.css'
import { useState } from "react";
import { CreateRoomToServerDTO, MsgType } from "../interfaces/DTO";

interface Props {
    setGUIState: (value: GUIState) => void
    sendMsgToWsServer: (message: string) => void
}

const CreateRoom: React.FC<Props> = ({ setGUIState, sendMsgToWsServer }) => {

    const [maxPlayers, setMaxPlayers] = useState<number>(10)
    const [roomName, setRoomName] = useState<string>("")
    const [roomVisibility, setRoomVisibility] = useState<string>("public")
    const [playerName, setPlayerName] = useState<string>("")
    
    const createGameHandler = () => {
        const dto: CreateRoomToServerDTO = {
            messageType: MsgType.CREATE_ROOM_TO_SERVER,
            roomName: roomName, playerName: playerName,
            isPrivate: roomVisibility === "private",
            maxPlayers: maxPlayers
        }

        sendMsgToWsServer(JSON.stringify(dto))
    }

    return (
        <div className="create-room-wrapper">
            <h1>Space balls</h1>
            <div className="create-room-gui form-box">
                <label htmlFor="enter-room-name">Room name </label>
                <input id='enter-room-name' type='text' placeholder="optional" 
                       maxLength={25} value={roomName}
                       onChange={(e) => setRoomName(e.target.value)} />

                <label htmlFor="enter-player-name">Player name </label>
                <input id='enter-player-name' type='text' placeholder='optional' value={playerName} 
                       onChange={(e) => setPlayerName(e.target.value)} />

                <div id="max-players-input-wrapper">
                    <label htmlFor='max-players-input'>Max players: </label>
                    <input id='max-players-input' type='number' min='1' max='10' value={maxPlayers} 
                           onChange={(e) => setMaxPlayers(e.target.valueAsNumber)} />
                </div>

                <div>
                    <input type="radio" id="public-option" name="lobby-type" value="public" 
                           checked={roomVisibility === "public"} 
                           onChange={(e) => setRoomVisibility(e.target.value)} />
                    <label htmlFor="public-option">Public</label>

                    <input type="radio" id="private-option" name="lobby-type" value="private" 
                           checked={roomVisibility === "private"}
                           onChange={(e) => setRoomVisibility(e.target.value)} />
                    <label htmlFor="private-option">Private</label>
                </div>

                <button onClick={createGameHandler}>Create</button>
                <button onClick={() => setGUIState(GUIState.MAIN_MENU)}>Cancel</button>
            </div>
        </div>
    )
} 

export default CreateRoom