import { GUIState } from "./App";

interface Props {
    setGUIState: (value: GUIState) => void
}

const CreateRoom: React.FC<Props> = ({ setGUIState }) => {
    return (
        <div>
            <h1>Space balls</h1>
            <p>Create room</p>
        </div>
    )
} 

export default CreateRoom