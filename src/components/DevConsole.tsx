import React, { useState, useEffect, useRef } from 'react';

function DevConsole() {
    const [logs, setLogs] = useState<string[]>([]);
    const [command, setCommand] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const log = (message: any) => {
        setLogs(prevLogs => [...prevLogs, message]);
    };

    const handleCommandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCommand(event.target.value);
    };

    const executeCommand = () => {
        try {
            const result = eval(command);
            log(`${command} = ${result}`);
        } catch (error) {
            log(`Error: ${error}`);
        }
        setCommand('');
    };

    useEffect(() => {
        const toggleVisibility = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                setIsVisible(prevIsVisible => !prevIsVisible);
            }
        };

        window.addEventListener('keydown', toggleVisibility);
        return () => {
            window.removeEventListener('keydown', toggleVisibility);
        };
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);  // Dependency on logs

    if (!isVisible) return null;

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
            <h4>Dev Console</h4>
            <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '10px',
                padding: '5px 0',
                border: '1px solid lime'
            }}>
                {logs.map((log, index) => (
                    <div key={index} style={{ wordWrap: 'break-word', textAlign: 'left' }}>{log}</div>
                ))}
                <div ref={logsEndRef} />  {/* Invisible element at the end of logs */}
            </div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <input
                    type="text"
                    value={command}
                    onChange={handleCommandChange}
                    style={{ 
                        flexGrow: 1, 
                        marginRight: '10px', 
                        boxSizing: 'border-box'
                    }}
                />
                <button onClick={executeCommand} style={{ 
                    flexShrink: 0,
                    boxSizing: 'border-box'
                }}>Execute</button>
            </div>
        </div>
    );
}

export default DevConsole;
