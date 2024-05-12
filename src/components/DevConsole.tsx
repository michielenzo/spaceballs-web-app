import React, { useState, useEffect, useRef } from 'react'
import { commandRegistry } from '../services/CommandRegistry'
import { BoundedStack } from '../services/BoundedStack'

const DevConsole: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([])
    const [command, setCommand] = useState('')
    const [isVisible, setIsVisible] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    
    const history = useRef<BoundedStack<string>>(new BoundedStack(100))
    const historyCursor = useRef<number>(0)
    const [triggerCaretMove, setTriggerCaretMove] = useState(0); // A counter to force re-render if command is the same.


    const log = (message: string) => {
        setLogs(prevLogs => [...prevLogs, message])
    }

    const handleCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(event.target.value)
    }

    const executeCommand = () => {
        if(command == '') return
        const tokens = command.split(' ')
        const functionName = tokens[0]
        const args = tokens.slice(1)

        try {
            const result = commandRegistry.executeCommand(functionName, ...args)
            let text = result === undefined ? "success" : "success: " + result  
            log(`${command} := ${text}`)
        } catch (error) {
            log(`${error}`)
        }

        history.current.push(command)
        setCommand('')
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            executeCommand()
            historyCursor.current = 0
        }

        // History cycling
        if(event.key === 'ArrowUp'){
            historyCursor.current++
            if(historyCursor.current > history.current.size()){
                historyCursor.current = history.current.size()
            }
            let prevCommand: string | undefined = history.current.peekAt(historyCursor.current)
            if(prevCommand) {
                setCommand(prevCommand) 
                setTriggerCaretMove(count => count + 1)
            }
        }
        if(event.key === 'ArrowDown'){
            historyCursor.current--
            if(historyCursor.current < 0){ historyCursor.current = 0 }
            if(historyCursor.current === 0){ setCommand('') }
            let nextCommand: string | undefined = history.current.peekAt(historyCursor.current)
            if(nextCommand) { 
                setCommand(nextCommand) 
                setTriggerCaretMove(count => count + 1)
            }
        }
        
    }

    useEffect(() => {
        // Use a timeout to defer execution until after the DOM updates
        const timeoutId = setTimeout(() => {
            if (inputRef.current) {
                const length = command.length;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(length, length);
            }
        }, 0); // Timeout set to 0 ms to delay execution until after the current call stack has cleared

        return () => clearTimeout(timeoutId); // Cleanup the timeout on effect cleanup
    }, [triggerCaretMove]);

    useEffect(() => {
        const toggleVisibility = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault()
                setIsVisible(prevIsVisible => !prevIsVisible)
            }
        }

        window.addEventListener('keydown', toggleVisibility)
        return () => window.removeEventListener('keydown', toggleVisibility)
    }, [])

    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus()
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
                border: '1px solid lime',
                background: '#111111'
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
