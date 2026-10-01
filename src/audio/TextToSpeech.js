/**
 * TextToSpeech.js
 * Browser text-to-speech utility with cooldown, voice tuning, and state pub/sub (Task B4 + B8 + Audio Feedback Fix).
 * Speaks recognized gestures aloud, exactly once per new gesture,
 * never overlapping, with a 1200ms cooldown for the same text.
 * Tuned with utterance.rate ≈ 0.95 and clear English voice selection.
 * Coordinates with SpeechToText to prevent acoustic echo feedback loops.
 */

export const COOLDOWN_MS = 1200;
export const SPEECH_RATE = 0.95;

let lastSpokenText = null;
let lastSpokenTime = 0;
let cachedVoices = [];
let isTtsActive = false;
let activeUtterance = null;
const ttsListeners = new Set();

/**
 * Returns whether TTS is currently speaking audio.
 * @returns {boolean}
 */
export function isTtsSpeaking() {
  return isTtsActive;
}

/**
 * Subscribe to TTS speaking state changes.
 * @param {Function} callback - Receives boolean (true when speaking, false when done).
 * @returns {Function} Unsubscribe function.
 */
export function subscribeTtsState(callback) {
  if (typeof callback !== 'function') return () => {};
  ttsListeners.add(callback);
  try {
    callback(isTtsActive);
  } catch (err) {
    console.error('[TextToSpeech] Initial callback error:', err);
  }
  return () => ttsListeners.delete(callback);
}

function setTtsState(active) {
  if (isTtsActive !== active) {
    isTtsActive = active;
    for (const cb of ttsListeners) {
      try {
        cb(active);
      } catch (err) {
        console.error('[TextToSpeech] Listener error:', err);
      }
    }
  }
}

function loadVoices() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  } else if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function selectEnglishVoice(synth) {
  const voices =
    synth && typeof synth.getVoices === "function"
      ? synth.getVoices()
      : cachedVoices;

  if (!voices || voices.length === 0) {
    return null;
  }

  const englishVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith("en")
  );

  if (englishVoices.length === 0) {
    return null;
  }

  // 1. Prefer default English voice
  const defaultEnglish = englishVoices.find((v) => v.default);
  if (defaultEnglish) {
    return defaultEnglish;
  }

  // 2. Prefer standard en-US voice
  const enUS = englishVoices.find(
    (v) => v.lang.toLowerCase().replace("_", "-") === "en-us"
  );
  if (enUS) {
    return enUS;
  }

  // 3. Fallback to first available English voice
  return englishVoices[0];
}

/**
 * Speaks text using the browser SpeechSynthesis API.
 * - Stops any currently speaking utterance before speaking new text.
 * - Enforces a 1200ms cooldown for repeating the exact same text.
 * - Does not block different text from speaking immediately.
 * - Sets speech rate to 0.95 and selects an English voice when available.
 * - Signals TTS state to prevent microphone feedback loop.
 *
 * @param {string} text The text to speak aloud.
 * @param {Function} [onStart] Optional start callback.
 * @param {Function} [onEnd] Optional completion callback.
 */
export function speak(text, onStart, onEnd) {
  if (!text || typeof text !== "string") {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const now = Date.now();
  if (trimmed === lastSpokenText && now - lastSpokenTime < COOLDOWN_MS) {
    return;
  }

  lastSpokenText = trimmed;
  lastSpokenTime = now;

  const synth =
    typeof window !== "undefined"
      ? window.speechSynthesis
      : typeof speechSynthesis !== "undefined"
        ? speechSynthesis
        : null;

  const Utterance =
    typeof window !== "undefined"
      ? window.SpeechSynthesisUtterance
      : typeof SpeechSynthesisUtterance !== "undefined"
        ? SpeechSynthesisUtterance
        : null;

  if (synth && Utterance) {
    synth.cancel();
    setTtsState(false);

    const utterance = new Utterance(trimmed);
    utterance.rate = SPEECH_RATE;

    const voice = selectEnglishVoice(synth);
    if (voice) {
      utterance.voice = voice;
    }

    activeUtterance = utterance;

    const finishUtterance = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
        setTtsState(false);
        if (typeof onEnd === "function") {
          onEnd();
        }
      }
    };

    utterance.onstart = () => {
      setTtsState(true);
      if (typeof onStart === "function") {
        onStart();
      }
    };

    utterance.onend = finishUtterance;
    utterance.onerror = finishUtterance;

    // Safety fallback: in case browser SpeechSynthesis drops event without onend
    const wordCount = trimmed.split(/\s+/).length;
    const safetyDurationMs = Math.max(1500, Math.ceil((wordCount / 2.0) * 1000) + 1500);
    const fallbackTimer = setTimeout(() => {
      finishUtterance();
    }, safetyDurationMs);

    const originalOnEnd = utterance.onend;
    utterance.onend = (e) => {
      clearTimeout(fallbackTimer);
      originalOnEnd(e);
    };

    setTtsState(true);
    synth.speak(utterance);
  }
}

export default {
  speak,
  isTtsSpeaking,
  subscribeTtsState,
  COOLDOWN_MS,
  SPEECH_RATE,
};
