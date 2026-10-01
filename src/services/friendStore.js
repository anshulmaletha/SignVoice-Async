const STORAGE_KEY = 'signvoice_friends_v1'

function getInitialFriends() {
  if (typeof window === 'undefined') return { friends: [], requests: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to read friends from localStorage', e)
  }
  return {
    friends: [
      { id: 'f1', name: 'Radhika Sharma', role: 'Signer', status: 'online', avatar: 'RS', lastActive: 'Active now' },
      { id: 'f2', name: 'Aarya Patel', role: 'Speaker', status: 'online', avatar: 'AP', lastActive: 'Active now' },
      { id: 'f3', name: 'Marcus Chen', role: 'Multimodal User', status: 'offline', avatar: 'MC', lastActive: '2h ago' },
      { id: 'f4', name: 'Elena Rostova', role: 'Signer', status: 'offline', avatar: 'ER', lastActive: 'Yesterday' },
    ],
    requests: [
      { id: 'r1', name: 'Devon Vance', role: 'Speaker', avatar: 'DV', sentAt: '1 day ago' },
    ],
  }
}

let store = getInitialFriends()
const listeners = new Set()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch (e) {
      console.warn('Failed to save friends to localStorage', e)
    }
  }
  listeners.forEach((fn) => fn(store))
}

export function getFriendsData() {
  return store
}

export function subscribeFriends(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function addFriend(name, role = 'Multimodal User') {
  if (!name.trim()) return
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const newFriend = {
    id: 'f_' + Date.now(),
    name: name.trim(),
    role,
    status: 'online',
    avatar: initials || 'SV',
    lastActive: 'Just now',
  }

  store = {
    ...store,
    friends: [newFriend, ...store.friends],
  }
  persist()
  return newFriend
}

export function removeFriend(id) {
  store = {
    ...store,
    friends: store.friends.filter((f) => f.id !== id),
  }
  persist()
}

export function acceptRequest(id) {
  const req = store.requests.find((r) => r.id === id)
  if (!req) return
  const newFriend = {
    id: 'f_' + Date.now(),
    name: req.name,
    role: req.role,
    status: 'online',
    avatar: req.avatar,
    lastActive: 'Just now',
  }
  store = {
    ...store,
    requests: store.requests.filter((r) => r.id !== id),
    friends: [newFriend, ...store.friends],
  }
  persist()
}

export function rejectRequest(id) {
  store = {
    ...store,
    requests: store.requests.filter((r) => r.id !== id),
  }
  persist()
}
