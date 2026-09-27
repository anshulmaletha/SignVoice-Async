import { clear } from '../services/conversationStore.js'

export default function ClearConversationButton() {
  return (
    <button type="button" className="clear-conversation-button" onClick={clear}>
      Clear
    </button>
  )
}
