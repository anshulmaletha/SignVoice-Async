import { subscribeTtsState, isTtsSpeaking } from '../audio/TextToSpeech.js';

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Natural pause threshold: 800ms (between 0.5s - 1.0s) after user stops speaking
export const PAUSE_THRESHOLD_MS = 800;

// Audio recovery settling delay: 250ms (between 200–300ms) after TTS speaker output ends
export const TTS_RECOVERY_DELAY_MS = 250;

const ERROR_MAP = {
  "not-allowed": "PERMISSION_DENIED",
  "no-speech": "NO_SPEECH_DETECTED",
  "network": "NETWORK_ERROR",
};

let recognition = null;
let isUserListening = false;
let isTtsSuppressed = false;
let pauseTimeoutId = null;
let recoveryTimeoutId = null;
let lastKnownTranscript = null;
let lastFinalizedIndex = -1;
let currentActiveIndex = -1;
let activeOnResult = null;
let activeOnError = null;

function clearPauseTimeout() {
  if (pauseTimeoutId) {
    clearTimeout(pauseTimeoutId);
    pauseTimeoutId = null;
  }
}

function clearRecoveryTimeout() {
  if (recoveryTimeoutId) {
    clearTimeout(recoveryTimeoutId);
    recoveryTimeoutId = null;
  }
}

function startRecognitionSession() {
  const Recognition =
    SpeechRecognition ||
    (typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null);

  if (!Recognition) {
    console.warn("SpeechRecognition is not supported in this browser.");
    return;
  }

  if (recognition) {
    recognition.onend = null;
    try {
      recognition.stop();
    } catch (err) {}
    recognition = null;
  }

  clearPauseTimeout();
  lastKnownTranscript = null;
  lastFinalizedIndex = -1;
  currentActiveIndex = -1;

  recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    // Guard: Drop all audio results arriving while TTS is speaking or in recovery window
    if (isTtsSuppressed || isTtsSpeaking()) {
      clearPauseTimeout();
      lastKnownTranscript = null;
      lastFinalizedIndex = event.results.length - 1;
      return;
    }

    const results = event.results;
    const currentIndex = results.length - 1;
    currentActiveIndex = currentIndex;

    const latestResult = results[currentIndex];
    if (!latestResult || !latestResult[0]) {
      return;
    }

    const text = latestResult[0].transcript;
    const isNativeFinal = latestResult.isFinal;

    // If this result index was already finalized (e.g. by our natural pause timer), ignore duplicate native final events
    if (currentIndex <= lastFinalizedIndex) {
      return;
    }

    clearPauseTimeout();

    if (isNativeFinal) {
      // Browser engine emitted final before pause timer
      lastFinalizedIndex = currentIndex;
      lastKnownTranscript = null;
      if (typeof activeOnResult === "function") {
        activeOnResult({
          text: text.trim(),
          isFinal: true,
          timestamp: Date.now(),
        });
      }
    } else {
      // Real-time interim result: emit immediately for zero-delay live captioning
      lastKnownTranscript = text;

      if (typeof activeOnResult === "function") {
        activeOnResult({
          text,
          isFinal: false,
          timestamp: Date.now(),
        });
      }

      // Schedule finalization after natural pause (800ms of silence)
      pauseTimeoutId = setTimeout(() => {
        if (
          isUserListening &&
          !isTtsSuppressed &&
          !isTtsSpeaking() &&
          lastKnownTranscript &&
          lastFinalizedIndex < currentIndex
        ) {
          lastFinalizedIndex = currentIndex;
          const finalText = lastKnownTranscript.trim();
          lastKnownTranscript = null;
          pauseTimeoutId = null;

          if (finalText && typeof activeOnResult === "function") {
            activeOnResult({
              text: finalText,
              isFinal: true,
              timestamp: Date.now(),
            });
          }
        }
      }, PAUSE_THRESHOLD_MS);
    }
  };

  recognition.onerror = (event) => {
    if (typeof activeOnError === "function" && event && event.error) {
      const mappedCode = ERROR_MAP[event.error];
      if (mappedCode) {
        activeOnError(mappedCode);
      }
    }
  };

  recognition.onend = () => {
    // Guard: Do NOT restart recognition if TTS is active or suppressed
    if (isTtsSuppressed || isTtsSpeaking()) {
      return;
    }

    if (isUserListening) {
      // Flush any pending transcript before restart
      if (
        lastKnownTranscript &&
        lastKnownTranscript.trim() &&
        lastFinalizedIndex < currentActiveIndex
      ) {
        lastFinalizedIndex = currentActiveIndex;
        const finalText = lastKnownTranscript.trim();
        lastKnownTranscript = null;
        clearPauseTimeout();

        if (typeof activeOnResult === "function") {
          activeOnResult({
            text: finalText,
            isFinal: true,
            timestamp: Date.now(),
          });
        }
      }

      try {
        recognition.start();
      } catch (err) {
        // If restart fails, safely recreate session
        startRecognitionSession();
      }
    }
  };

  try {
    recognition.start();
  } catch (err) {
    // Prevents uncaught exceptions if duplicate start occurs
  }
}

// Subscribe to global TTS state changes for automatic echo suppression & recovery
subscribeTtsState((ttsActive) => {
  if (ttsActive) {
    // 1. TTS started: mark suppressed immediately
    isTtsSuppressed = true;
    clearRecoveryTimeout();
    clearPauseTimeout();
    lastKnownTranscript = null;

    // Temporarily pause/stop STT recognition so microphone does not capture TTS speaker output
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch (err) {}
      recognition = null;
    }
  } else {
    // 2. TTS ended: wait 250ms recovery settling window before resuming STT
    clearRecoveryTimeout();
    recoveryTimeoutId = setTimeout(() => {
      isTtsSuppressed = false;
      recoveryTimeoutId = null;
      lastKnownTranscript = null;

      // 3. Resume STT ONLY IF user had microphone enabled before TTS started
      if (isUserListening && !recognition) {
        startRecognitionSession();
      }
    }, TTS_RECOVERY_DELAY_MS);
  }
});

export function startListening(onResult, onError) {
  isUserListening = true;
  activeOnResult = onResult;
  activeOnError = onError;

  // If TTS is currently speaking or in recovery, wait for TTS to finish and settle
  if (isTtsSuppressed || isTtsSpeaking()) {
    return;
  }

  startRecognitionSession();
}

export function stopListening(onResult) {
  isUserListening = false;
  activeOnResult = null;
  activeOnError = null;

  clearRecoveryTimeout();
  clearPauseTimeout();

  // If user stopped mic while speaking, finalize immediately so words aren't lost
  if (
    lastKnownTranscript &&
    lastKnownTranscript.trim() &&
    lastFinalizedIndex < currentActiveIndex &&
    !isTtsSuppressed &&
    !isTtsSpeaking()
  ) {
    lastFinalizedIndex = currentActiveIndex;
    const finalText = lastKnownTranscript.trim();
    if (typeof onResult === "function") {
      onResult({
        text: finalText,
        isFinal: true,
        timestamp: Date.now(),
      });
    }
  }

  lastKnownTranscript = null;

  if (recognition) {
    try {
      recognition.onend = null;
      recognition.stop();
    } catch (err) {}
    recognition = null;
  }
}

export default {
  startListening,
  stopListening,
  PAUSE_THRESHOLD_MS,
  TTS_RECOVERY_DELAY_MS,
};
