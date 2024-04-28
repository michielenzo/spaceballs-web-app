import React, { useState, useEffect, useRef } from 'react'

function DevConsole() {
    const [logs, setLogs] = useState<string[]>([])
    const [command, setCommand] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const log = (message: any) => {
        setLogs(prevLogs => [...prevLogs, message])
    };

    const handleCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(event.target.value)
    };

    const executeCommand = () => {
        try {
            const result = eval(command)
            log(`${command} = ${result}`)
        } catch (error) {
            log(`Error: ${error}`)
        }
        setCommand('');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            executeCommand()
        }
    };

    useEffect(() => {
        const toggleVisibility = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault()
                setIsVisible(prevIsVisible => !prevIsVisible)
            }
        };

        window.addEventListener('keydown', toggleVisibility);
        return () => {
            window.removeEventListener('keydown', toggleVisibility)
        };
    }, []);

    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus() // Automatically focus the input field.
        }
    }, [isVisible])

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs])

    if (!isVisible) return null

    return (
        <div style={{ 
            background: 'black', 
            color: 'lime', 
            fontFamily: 'monospace', 
            position: 'fixed', 
            bottom: 0, 
            right: 0, 
            width: '350px', 
            maxHeight: '50%', 
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: '10px'
        }}>
            <h2 style={{ marginTop: '8px' }}>Dev Console</h2>
            <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '5px',
                padding: '3px 0',
                border: '1px solid lime'
            }}>
                {logs.map((log, index) => (
                    <div key={index} style={{ wordWrap: 'break-word', textAlign: 'left', marginLeft: '3px', marginRight: '3px'}}>{log}</div>
                ))}
                <div ref={logsEndRef} />  {/* Invisible element at the end of logs */}
            </div>
            <div style={{ display: 'flex' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={handleCommandChange}
                    onKeyDown={handleKeyDown}
                    style={{ 
                        flexGrow: 1, 
                        marginRight: '0px',
                        marginLeft: '0px', 
                        padding: '4px',
                        boxSizing: 'border-box',
                        background: '#111111',
                        border: '1px solid lime',
                        color: 'lime',
                        borderRadius: '0'
                    }}
                />
            </div>
        </div>
    )
}

export default DevConsole
