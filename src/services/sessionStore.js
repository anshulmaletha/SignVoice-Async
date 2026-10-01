import { nextId } from '../utils/idGenerator.js'
import { getMessages } from './conversationStore.js'

const STORAGE_KEY = 'signvoice_sessions_v1'

function getInitialSessions() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to read sessions from localStorage', e)
  }
  // Default seed sessions for a realistic, functional experience
  const now = Date.now()
  return [
    {
      id: 'sess_1',
      title: 'Multimodal Practice Session',
      startedAt: now - 3600000 * 2, // 2 hours ago
      endedAt: now - 3600000 * 2 + 600000,
      messageCount: 8,
      status: 'completed',
      messages: [
        { id: 'm1', sender: 'speech_user', text: 'Hello, can you see my signs?', type: 'speech', timestamp: now - 3600000 * 2 },
        { id: 'm2', sender: 'sign_user', text: 'HELLO', type: 'sign', timestamp: now - 3600000 * 2 + 10000 },
        { id: 'm3', sender: 'sign_user', text: 'YES', type: 'sign', timestamp: now - 3600000 * 2 + 25000 },
        { id: 'm4', sender: 'speech_user', text: 'Great! Are you ready to start?', type: 'speech', timestamp: now - 3600000 * 2 + 40000 },
        { id: 'm5', sender: 'sign_user', text: 'YES', type: 'sign', timestamp: now - 3600000 * 2 + 55000 },
        { id: 'm6', sender: 'speech_user', text: 'Do you need any help with the setup?', type: 'speech', timestamp: now - 3600000 * 2 + 70000 },
        { id: 'm7', sender: 'sign_user', text: 'THANK_YOU', type: 'sign', timestamp: now - 3600000 * 2 + 85000 },
        { id: 'm8', sender: 'sign_user', text: 'STOP', type: 'sign', timestamp: now - 3600000 * 2 + 100000 },
      ],
    },
    {
      id: 'sess_2',
      title: 'Daily Standup Sync',
      startedAt: now - 86400000, // Yesterday
      endedAt: now - 86400000 + 900000,
      messageCount: 4,
      status: 'completed',
      messages: [
        { id: 'm9', sender: 'speech_user', text: 'Starting our daily checkin.', type: 'speech', timestamp: now - 86400000 },
        { id: 'm10', sender: 'sign_user', text: 'HELLO', type: 'sign', timestamp: now - 86400000 + 15000 },
        { id: 'm11', sender: 'sign_user', text: 'YES', type: 'sign', timestamp: now - 86400000 + 35000 },
        { id: 'm12', sender: 'speech_user', text: 'Everything looks on track.', type: 'speech', timestamp: now - 86400000 + 60000 },
      ],
    },
  ]
}

let sessions = getInitialSessions()
const listeners = new Set()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (e) {
      console.warn('Failed to save sessions to localStorage', e)
    }
  }
  listeners.forEach((fn) => fn(sessions))
}

export function getSessions() {
  return sessions
}

export function subscribeSessions(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function saveCurrentSession(title = 'Active Session') {
  const currentMessages = getMessages()
  if (currentMessages.length === 0) return null

  const newSession = {
    id: 'sess_' + nextId(),
    title: title,
    startedAt: currentMessages[0]?.timestamp || Date.now(),
    endedAt: Date.now(),
    messageCount: currentMessages.length,
    status: 'completed',
    messages: [...currentMessages],
  }

  sessions = [newSession, ...sessions]
  persist()
  return newSession
}

export function deleteSession(id) {
  sessions = sessions.filter((s) => s.id !== id)
  persist()
}

export function clearAllSessions() {
  sessions = []
  persist()
}
