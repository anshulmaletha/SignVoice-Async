const MESSAGES = {
  camera: {
    default: 'Camera unavailable. Please check your device.',
    NotAllowedError: 'Camera permission denied. Please allow camera access and reload.',
    PermissionDeniedError: 'Camera permission denied. Please allow camera access and reload.',
    NotFoundError: 'No camera found on this device.',
    DevicesNotFoundError: 'No camera found on this device.',
  },
  mic: {
    default: 'Microphone unavailable.',
    PERMISSION_DENIED: 'Microphone permission denied. Please allow microphone access and reload.',
    NO_SPEECH_DETECTED: 'No speech detected. Try speaking closer to the microphone.',
    NETWORK_ERROR: 'Network error during speech recognition. Check your connection.',
    SERVICE_NOT_ALLOWED: 'Speech recognition service is not allowed by your browser.',
    AUDIO_CAPTURE_FAILED: 'Audio capture device failed. Please check your microphone hardware.',
  },
}

export default function PermissionBanner({ type, code }) {
  const set = MESSAGES[type] || {}
  const message = set[code] || set.default || 'Something went wrong.'
  return <div className={`permission-banner permission-banner--${type}`}>{message}</div>
}
