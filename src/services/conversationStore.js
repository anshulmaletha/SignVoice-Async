import { nextId } from '../utils/idGenerator.js'
import { createEventBus } from './eventBus.js'

let messages = []
const bus = createEventBus()

export function addMessage(partialMsg) {
  const message = {
    id: partialMsg.id ?? nextId(),
    sender: partialMsg.sender,
    text: partialMsg.text,
    type: partialMsg.type,
    timestamp: partialMsg.timestamp ?? Date.now(),
  }
  messages = [...messages, message]
  bus.emit(messages)
  return message
}
export function getMessages() { return messages }
export function subscribe(callback) { return bus.subscribe(callback) }
export function clear() { messages = []; bus.emit(messages) }
