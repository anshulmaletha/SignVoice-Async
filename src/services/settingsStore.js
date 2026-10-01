const STORAGE_KEY = 'signvoice_settings_v1'

const defaultSettings = {
  darkMode: true,
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

export function applyTheme(isDark) {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

function getInitialSettings() {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = { ...defaultSettings, ...JSON.parse(raw) }
      applyTheme(parsed.darkMode)
      return parsed
    }
  } catch (e) {
    console.warn('Failed to read settings from localStorage', e)
  }
  applyTheme(defaultSettings.darkMode)
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
  applyTheme(settings.darkMode)
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
