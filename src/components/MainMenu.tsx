import { forwardRef } from "react";
import '../css/MainMenu.css'
import '../css/Generic.css'
import { GUIState } from "./App";


interface Props {
    setGUIState: (value: GUIState) => void
}

const MainMenu: React.FC<Props> = ({ setGUIState }) => {
    return (
        <div>
            <h1>Space balls</h1>
            <div className='main-menu'>
                <div className='main-menu-gui'>
                    <button onClick={() => setGUIState(GUIState.CREATE_ROOM)}>Create Room</button>
                    <button onClick={() => setGUIState(GUIState.JOIN_ROOM)}>Join Room</button>
                </div>
            </div>
        </div>
    )
} 

export default MainMenu