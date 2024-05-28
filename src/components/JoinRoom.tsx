import { GUIState } from "./App";
import '../css/Generic.css'
import '../css/JoinRoom.css'
import { useState } from "react";
import { JoinRoomToServerDTO, MsgType, RefreshRoomsOverviewToServer } from "../interfaces/DTO";

interface Props {
    setGUIState: (value: GUIState) => void
    sendMsgToWsServer: (message: string) => void
}

const JoinRoom: React.FC<Props> = ({ setGUIState, sendMsgToWsServer }) => {

    const [roomCode, setRoomCode] = useState<string>("")

    const joinRoomHandler = () => {
        console.log("click")
    }

    const refreshHandler = () => {
        const dto: RefreshRoomsOverviewToServer = {
            messageType: MsgType.REFRESH_ROOMS_OVERVIEW_TO_SERVER
        }

        sendMsgToWsServer(JSON.stringify(dto))
    }

    return (
        <div className="join-room-wrapper">
            <h1>Space balls</h1>
            <div className="join-room-gui form-box">
                <div id="join-by-code">
                    <input id="enter-room-code-input" type='text' 
                           placeholder="Enter room code..."
                           value={roomCode}
                           onChange={(e) => setRoomCode(e.target.value)} />
                    <button onClick={joinRoomHandler}>Join</button>
                    <button id="cancel-btn" onClick={() => setGUIState(GUIState.MAIN_MENU)}>Cancel</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Room Code</th>
                            <th>Name</th>
                            <th>Players</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>GHRIH</td>
                            <td>Player 1's room</td>
                            <td>3/5</td>
                        </tr>
                    </tbody>
                </table>
                
                <div>
                    <button onClick={refreshHandler}>Refresh</button>
                </div>
            </div>
        </div>
    )
} 

export default JoinRoom