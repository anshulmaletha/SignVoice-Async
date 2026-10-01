const STORAGE_KEY = 'signvoice_profile_v1'
const ACTIVE_USER_KEY = 'signvoice_active_user'

export const DEMO_PROFILES = {
  Anshul: {
    name: 'Anshul Maletha',
    username: 'Anshul',
    avatar: 'AM',
    role: 'Sign Language User',
    status: 'Connected',
    bio: 'Bridging communication gaps with real-time sign language and speech AI.',
    preferredMode: 'Multimodal (Sign + Speech)',
    primaryLanguage: 'English (US)',
    email: 'anshul@signvoice.io',
    memberSince: 'September 2026',
  },
  Aarya: {
    name: 'Aarya Sharma',
    username: 'Aarya',
    avatar: 'AS',
    role: 'Sign Language Specialist',
    status: 'Connected',
    bio: 'Specialist in non-verbal communication and multimodal AI interfaces.',
    preferredMode: 'Visual Sign Preferred',
    primaryLanguage: 'English (US)',
    email: 'aarya@signvoice.io',
    memberSince: 'September 2026',
  },
  Radhika: {
    name: 'Radhika Patel',
    username: 'Radhika',
    avatar: 'RP',
    role: 'Accessibility Advocate',
    status: 'Connected',
    bio: 'Advocating for inclusive design and real-time accessibility tech.',
    preferredMode: 'Multimodal (Sign + Speech)',
    primaryLanguage: 'English (US)',
    email: 'radhika@signvoice.io',
    memberSince: 'September 2026',
  },
  NeuraX: {
    name: 'NeuraX System',
    username: 'NeuraX',
    avatar: 'NX',
    role: 'AI Neural System Admin',
    status: 'Connected',
    bio: 'Core AI developer account for SignVoice real-time pipeline testing.',
    preferredMode: 'Voice Speech Preferred',
    primaryLanguage: 'English (US)',
    email: 'neurax@signvoice.io',
    memberSince: 'September 2026',
  },
}

export function getDemoProfile(usernameKey) {
  if (!usernameKey) return DEMO_PROFILES.Anshul
  const key = Object.keys(DEMO_PROFILES).find(
    (k) => k.toLowerCase() === usernameKey.trim().toLowerCase()
  )
  if (key) return DEMO_PROFILES[key]
  
  const cleanUser = usernameKey.trim()
  return {
    name: cleanUser,
    username: cleanUser,
    avatar: cleanUser.substring(0, 2).toUpperCase(),
    role: 'Sign Language User',
    status: 'Connected',
    bio: 'SignVoice AI Multimodal Communication User.',
    preferredMode: 'Multimodal (Sign + Speech)',
    primaryLanguage: 'English (US)',
    email: `${cleanUser.toLowerCase()}@signvoice.io`,
    memberSince: 'September 2026',
  }
}

function getInitialProfile() {
  if (typeof window === 'undefined') return DEMO_PROFILES.Anshul
  try {
    const activeUsername = sessionStorage.getItem(ACTIVE_USER_KEY)
    if (activeUsername) {
      const base = getDemoProfile(activeUsername)
      const stored = localStorage.getItem(`${STORAGE_KEY}_${base.username}`)
      if (stored) {
        return { ...base, ...JSON.parse(stored) }
      }
      return base
    }
  } catch (e) {
    console.warn('Failed to read profile from storage', e)
  }
  return DEMO_PROFILES.Anshul
}

let profile = getInitialProfile()
const listeners = new Set()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      if (profile && profile.username) {
        localStorage.setItem(`${STORAGE_KEY}_${profile.username}`, JSON.stringify(profile))
      }
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e)
    }
  }
  listeners.forEach((fn) => fn(profile))
}

export function getProfile() {
  return profile
}

export function setActiveProfile(usernameKey) {
  const newProfile = getDemoProfile(usernameKey)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(ACTIVE_USER_KEY, newProfile.username)
      const stored = localStorage.getItem(`${STORAGE_KEY}_${newProfile.username}`)
      if (stored) {
        profile = { ...newProfile, ...JSON.parse(stored) }
      } else {
        profile = newProfile
      }
    } catch (e) {
      profile = newProfile
    }
  } else {
    profile = newProfile
  }
  listeners.forEach((fn) => fn(profile))
  return profile
}

export function clearActiveProfile() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(ACTIVE_USER_KEY)
    } catch (e) {}
  }
  profile = DEMO_PROFILES.Anshul
  listeners.forEach((fn) => fn(profile))
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
