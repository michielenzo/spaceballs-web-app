import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Howl, Howler } from 'howler'
import { faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../css/AudioPlayer.css'

interface SoundInfo {
    label: string
    volume: number
    src: string
}

interface HowlerProps {
    sounds: SoundInfo[]
}

export interface AudioPlayerMethods {
    playSound: (label: string) => void
}

const AudioPlayer: React.ForwardRefRenderFunction<AudioPlayerMethods, HowlerProps> = ({ sounds }, ref) => {
    const soundInstancesRef = useRef<Record<string, Howl>>({})

    const [isMuted, setMuted] = useState<boolean>(() => {
        const savedMuteState = localStorage.getItem('isMuted')
        return savedMuteState === 'true'
    })

    useEffect(() => {
        sounds.forEach((sound) => {
            const { src } = sound;
            soundInstancesRef.current[sound.label] = new Howl({
                src: [src],
                preload: true,
                volume: sound.volume
            })
        })

        Howler.mute(isMuted)

        return () => {
            Object.values(soundInstancesRef.current).forEach((sound) => sound.stop())
        }
    }, [sounds])

    useImperativeHandle(ref, () => ({
        playSound(label: string){
            const sound = soundInstancesRef.current[label]
            if (sound) {
                sound.stop()
                sound.play()
            }
        }
    }))

    function handleMuteClick(){
        Howler.mute(!isMuted)
        setMuted(!isMuted)
        localStorage.setItem('isMuted', String(!isMuted))
    }

    return (
        <button onClick={handleMuteClick} id='mute-btn'>
            <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} id='mute-icon' />
        </button>
    )
}

export default React.forwardRef(AudioPlayer)
