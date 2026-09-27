const STORAGE_KEY = 'signvoice_settings_v1'

const defaultSettings = {
  selectedCameraId: '',
  selectedMicId: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVoice: '',
  ttsMuted: false,
  demoMode: false,
  fontSize: 'standard',
  highContrast: false,
  autoScrollChat: true,
  echoGuard: true,
}

function getInitialSettings() {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch (e) {
    console.warn('Failed to read settings from localStorage', e)
  }
  return defaultSettings
}

let settings = getInitialSettings()
const listeners = new Set()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e)
    }
  }
  listeners.forEach((fn) => fn(settings))
}

export function getSettings() {
  return settings
}

export function updateSettings(partial) {
  settings = { ...settings, ...partial }
  persist()
  return settings
}

export function subscribeSettings(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
