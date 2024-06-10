import React from 'react'
import '../css/CustomAlert.css'
import '../css/Generic.css'

interface CustomAlertProps {
    message: string;
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, onClose }) => {
    return (
        <div className="custom-alert-overlay">
            <div className="custom-alert">
                <h2>{message}</h2>
                <button className='btn-type1' onClick={onClose}>OK</button>
            </div>
        </div>
    )
}

export default CustomAlert
