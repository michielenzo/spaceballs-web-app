import { GUIState } from "./App";

interface Props {
    setGUIState: (value: GUIState) => void
}

const JoinRoom: React.FC<Props> = ({ setGUIState }) => {
    return (
        <div>
            <h1>Space balls</h1>
            <p>Join room</p>
        </div>
    )
} 

export default JoinRoom