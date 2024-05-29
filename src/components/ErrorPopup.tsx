import React, { useEffect, useState } from 'react'
import '../css/ErrorPopup.css'

interface Props {
  message: string
  duration?: number // Duration in milliseconds
}

const ErrorPopup: React.FC<Props> = ({ message, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div className={`error-popup ${isVisible ? 'fade-in' : 'fade-out'}`}>
      {message} 
    </div>
  )
}

export default ErrorPopup
