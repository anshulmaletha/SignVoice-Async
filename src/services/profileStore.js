const STORAGE_KEY = 'signvoice_profile_v1'

const defaultProfile = {
  name: 'Anshul Maletha',
  username: 'anshul',
  avatar: 'AM',
  role: 'Sign Language User',
  status: 'Connected',
  bio: 'Bridging communication gaps with real-time sign language and speech AI.',
  preferredMode: 'Multimodal (Sign + Speech)',
  primaryLanguage: 'English (US)',
  email: 'anshul@signvoice.io',
  memberSince: 'September 2026',
}

function getInitialProfile() {
  if (typeof window === 'undefined') return defaultProfile
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) }
  } catch (e) {
    console.warn('Failed to read profile from localStorage', e)
  }
  return defaultProfile
}

let profile = getInitialProfile()
const listeners = new Set()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e)
    }
  }
  listeners.forEach((fn) => fn(profile))
}

export function getProfile() {
  return profile
}

export function updateProfile(partial) {
  profile = { ...profile, ...partial }
  persist()
  return profile
}

export function subscribeProfile(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
