export default function ConversationMessageItem({ message }) {
  const isSign = message.sender === 'sign_user'
  const timeStr = message.timestamp
    ? typeof message.timestamp === 'number'
      ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : message.timestamp
    : ''

  return (
    <div
      className={`conversation-message ${
        isSign ? 'conversation-message--sign' : 'conversation-message--speech'
      }`}
    >
      <div className="conversation-message__header">
        <span className="conversation-message__icon">
          {isSign ? '🤟' : '🗣️'}
        </span>
        <span className="conversation-message__sender">
          {isSign ? 'Sign Language' : 'Voice Speech'}
        </span>
        {timeStr && <span className="conversation-message__time">{timeStr}</span>}
      </div>
      <div className="conversation-message__text">{message.text}</div>
    </div>
  )
}
