
export const ConnectionLost: React.FC = () => {
    return (
      <div className="connection-lost">
        <h1>Connection to the server is lost.</h1>
        <p>Refresh the page to reestablish.</p>
      </div>
    )
}

export const ConnectionFailed: React.FC = () => {
    return (
        <div className="connection-failed">
        <h1>Could not connect to the server.</h1>
        <p>Refresh the page, or try again later if the problem persists.</p>
      </div>
    )
}
