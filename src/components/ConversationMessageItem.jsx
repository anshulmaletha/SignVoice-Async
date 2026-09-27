export default function ConversationMessageItem({ message }) {
  const isSign = message.sender === 'sign_user'
  return (
    <div
      className={`conversation-message ${
        isSign ? 'conversation-message--sign' : 'conversation-message--speech'
      }`}
    >
      <span className="conversation-message__icon">{isSign ? '\u{1F91F}' : '\u{1F5E3}\uFE0F'}</span>
      <span className="conversation-message__text">{message.text}</span>
    </div>
  )
}
