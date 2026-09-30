import { subscribeTtsState, isTtsSpeaking } from '../audio/TextToSpeech.js';

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Natural pause threshold: 800ms after user pauses speaking
export const PAUSE_THRESHOLD_MS = 800;

// Audio recovery settling delay: 250ms after TTS speaker output ends
export const TTS_RECOVERY_DELAY_MS = 250;

// Maximum continuous session age before proactive cycling: 45 seconds
export const MAX_SESSION_DURATION_MS = 45000;

// Deduplication window: 4000ms to ignore duplicate flushed final results
const DEDUPLICATION_WINDOW_MS = 4000;

let recognition = null;
let isUserListening = false;
let isTtsSuppressed = false;
let sessionState = 'IDLE'; // 'IDLE' | 'STARTING' | 'LISTENING' | 'STOPPING'
let sessionStartTime = 0;

let pauseTimeoutId = null;
let recoveryTimeoutId = null;
let restartTimeoutId = null;
let maxDurationTimeoutId = null;
let consecutiveFailures = 0;

let lastInterimTranscript = '';
let activeOnResult = null;
let activeOnError = null;

// Circular buffer of recent final transcripts to prevent duplicate emissions
const recentFinalHistory = [];

function logLifecycle(event, details = '') {
  const ts = new Date().toISOString().substring(11, 23);
  console.log(`[STT Lifecycle ${ts}] ${event}${details ? ` -> ${details}` : ''}`);
}

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

function clearRestartTimeout() {
  if (restartTimeoutId) {
    clearTimeout(restartTimeoutId);
    restartTimeoutId = null;
  }
}

function clearMaxDurationTimeout() {
  if (maxDurationTimeoutId) {
    clearTimeout(maxDurationTimeoutId);
    maxDurationTimeoutId = null;
  }
}

function isDuplicateFinal(text) {
  const normalized = text.trim().toLowerCase();
  const now = Date.now();
  // Prune history older than 10 seconds
  while (recentFinalHistory.length > 0 && now - recentFinalHistory[0].time > 10000) {
    recentFinalHistory.shift();
  }
  return recentFinalHistory.some(
    (item) => item.text === normalized && now - item.time < DEDUPLICATION_WINDOW_MS
  );
}

function recordFinal(text) {
  const normalized = text.trim().toLowerCase();
  recentFinalHistory.push({ text: normalized, time: Date.now() });
  if (recentFinalHistory.length > 25) {
    recentFinalHistory.shift();
  }
}

function destroyRecognitionInstance() {
  clearMaxDurationTimeout();
  if (recognition) {
    recognition.onstart = null;
    recognition.onaudiostart = null;
    recognition.onsoundstart = null;
    recognition.onspeechstart = null;
    recognition.onresult = null;
    recognition.onnomatch = null;
    recognition.onspeechend = null;
    recognition.onsoundend = null;
    recognition.onaudioend = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      if (sessionState === 'LISTENING' || sessionState === 'STARTING') {
        recognition.stop();
      }
    } catch (_) {}

    try {
      recognition.abort();
    } catch (_) {}

    recognition = null;
  }
  sessionState = 'IDLE';
}

function emitFinalResult(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return;

  if (isDuplicateFinal(trimmed)) {
    logLifecycle('emitFinalResult', `Duplicate suppressed: "${trimmed}"`);
    return;
  }

  recordFinal(trimmed);
  lastInterimTranscript = '';

  const now = Date.now();
  logLifecycle('emitFinalResult', `Emitting final: "${trimmed}" (len: ${trimmed.length})`);

  if (typeof activeOnResult === 'function') {
    activeOnResult({
      text: trimmed,
      isFinal: true,
      timestamp: now,
    });
  }
}

function flushPendingTranscript() {
  clearPauseTimeout();
  if (lastInterimTranscript && lastInterimTranscript.trim()) {
    const pending = lastInterimTranscript.trim();
    lastInterimTranscript = '';
    if (!isTtsSuppressed && !isTtsSpeaking()) {
      logLifecycle('flushPendingTranscript', `Flushing pending text: "${pending}"`);
      emitFinalResult(pending);
    }
  }
}

function cycleRecognitionSession() {
  if (!isUserListening || isTtsSuppressed || isTtsSpeaking()) return;
  if (!recognition || sessionState !== 'LISTENING') return;

  logLifecycle('cycleSession', 'Gracefully cycling recognition stream to prevent cloud buffer stall');
  sessionState = 'STOPPING';
  try {
    recognition.stop();
  } catch (err) {
    logLifecycle('cycleSession', `recognition.stop() caught: ${err?.message || err}`);
  }
}

function startRecognitionSession() {
  const Recognition =
    SpeechRecognition ||
    (typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null);

  if (!Recognition) {
    logLifecycle('error', 'SpeechRecognition API not supported in this browser');
    if (typeof activeOnError === 'function') {
      activeOnError('NOT_SUPPORTED');
    }
    return;
  }

  // Guard: if already listening or starting, do not create duplicate
  if (recognition && (sessionState === 'LISTENING' || sessionState === 'STARTING')) {
    logLifecycle('startSession', 'Session already active or starting, skipping duplicate start');
    return;
  }

  destroyRecognitionInstance();
  clearPauseTimeout();
  clearMaxDurationTimeout();

  try {
    logLifecycle('create', 'Creating new SpeechRecognition instance');
    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    sessionState = 'STARTING';
    sessionStartTime = Date.now();

    // 1. Lifecycle: onstart
    recognition.onstart = () => {
      sessionState = 'LISTENING';
      logLifecycle('onstart', 'SpeechRecognition service began listening');

      // Schedule proactive cycle before Google 60s timeout
      clearMaxDurationTimeout();
      maxDurationTimeoutId = setTimeout(() => {
        logLifecycle('maxDuration', 'Session reached 45s threshold, proactive cycle scheduled');
        cycleRecognitionSession();
      }, MAX_SESSION_DURATION_MS);
    };

    // 2. Lifecycle: onaudiostart
    recognition.onaudiostart = () => {
      logLifecycle('onaudiostart', 'Microphone audio capture started');
    };

    // 3. Lifecycle: onsoundstart
    recognition.onsoundstart = () => {
      logLifecycle('onsoundstart', 'Sound detected on audio stream');
    };

    // 4. Lifecycle: onspeechstart
    recognition.onspeechstart = () => {
      logLifecycle('onspeechstart', 'Speech detected by recognizer');
    };

    // 5. Lifecycle: onresult
    recognition.onresult = (event) => {
      // Guard: Drop audio captured while TTS output is active or settling
      if (isTtsSuppressed || isTtsSpeaking()) {
        clearPauseTimeout();
        lastInterimTranscript = '';
        return;
      }

      // Reset failure counter on successfully receiving speech data
      consecutiveFailures = 0;

      let hasFinal = false;
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res || !res[0]) continue;
        const transcript = res[0].transcript || '';

        logLifecycle(
          'onresult',
          `index: ${i}, isFinal: ${res.isFinal}, confidence: ${res[0].confidence?.toFixed(2) || 'N/A'}, text: "${transcript}"`
        );

        if (res.isFinal) {
          hasFinal = true;
          const finalText = transcript.trim();
          if (finalText) {
            emitFinalResult(finalText);
          }
        } else {
          interim += (interim ? ' ' : '') + transcript;
        }
      }

      if (hasFinal) {
        clearPauseTimeout();
        lastInterimTranscript = interim;
      }

      if (interim) {
        lastInterimTranscript = interim;

        // Emit real-time interim result for instant live captioning
        if (typeof activeOnResult === 'function') {
          activeOnResult({
            text: interim,
            isFinal: false,
            timestamp: Date.now(),
          });
        }

        // Schedule finalization after natural pause (800ms of silence)
        clearPauseTimeout();
        pauseTimeoutId = setTimeout(() => {
          if (isUserListening && !isTtsSuppressed && !isTtsSpeaking() && lastInterimTranscript) {
            const pending = lastInterimTranscript.trim();
            lastInterimTranscript = '';
            pauseTimeoutId = null;
            if (pending) {
              logLifecycle('pauseTimeout', `Finalizing after ${PAUSE_THRESHOLD_MS}ms pause: "${pending}"`);
              emitFinalResult(pending);
              // Cycle recognition stream to prevent cloud buffer stall
              cycleRecognitionSession();
            }
          }
        }, PAUSE_THRESHOLD_MS);
      } else if (!hasFinal) {
        lastInterimTranscript = '';
      }
    };

    // 6. Lifecycle: onnomatch
    recognition.onnomatch = () => {
      logLifecycle('onnomatch', 'No match found for captured audio');
    };

    // 7. Lifecycle: onspeechend
    recognition.onspeechend = () => {
      logLifecycle('onspeechend', 'Speech ceased being detected by recognizer');
    };

    // 8. Lifecycle: onsoundend
    recognition.onsoundend = () => {
      logLifecycle('onsoundend', 'Sound ceased on audio stream');
    };

    // 9. Lifecycle: onaudioend
    recognition.onaudioend = () => {
      logLifecycle('onaudioend', 'Microphone audio capture ended');
    };

    // 10. Lifecycle: onerror
    recognition.onerror = (event) => {
      const error = event ? event.error : 'unknown';
      logLifecycle('onerror', `error: ${error}`);

      // 1. Benign/Non-fatal errors: silence or intentional abort
      if (error === 'no-speech') {
        // Normal conversation pause. onend will fire and restart if user is listening.
        return;
      }
      if (error === 'aborted') {
        // Preempted or intentional abort.
        return;
      }

      // 2. Fatal permission/service errors:
      if (error === 'not-allowed') {
        isUserListening = false;
        destroyRecognitionInstance();
        if (typeof activeOnError === 'function') {
          activeOnError('PERMISSION_DENIED');
        }
        return;
      }
      if (error === 'service-not-allowed') {
        isUserListening = false;
        destroyRecognitionInstance();
        if (typeof activeOnError === 'function') {
          activeOnError('SERVICE_NOT_ALLOWED');
        }
        return;
      }
      if (error === 'audio-capture') {
        isUserListening = false;
        destroyRecognitionInstance();
        if (typeof activeOnError === 'function') {
          activeOnError('AUDIO_CAPTURE_FAILED');
        }
        return;
      }
      if (error === 'language-not-supported') {
        isUserListening = false;
        destroyRecognitionInstance();
        if (typeof activeOnError === 'function') {
          activeOnError('LANGUAGE_NOT_SUPPORTED');
        }
        return;
      }

      // 3. Transient network disconnects to Google Speech cloud service:
      if (error === 'network') {
        consecutiveFailures++;
        logLifecycle('networkError', `Consecutive network failures: ${consecutiveFailures}`);
        if (consecutiveFailures >= 5) {
          isUserListening = false;
          destroyRecognitionInstance();
          if (typeof activeOnError === 'function') {
            activeOnError('NETWORK_ERROR');
          }
        }
        return;
      }

      // 4. Other unexpected errors:
      consecutiveFailures++;
      if (consecutiveFailures >= 5) {
        isUserListening = false;
        destroyRecognitionInstance();
        if (typeof activeOnError === 'function') {
          activeOnError(error.toUpperCase());
        }
      }
    };

    // 11. Lifecycle: onend
    recognition.onend = () => {
      logLifecycle('onend', 'Recognition stream closed');
      sessionState = 'IDLE';

      // Flush any pending interim text so last spoken words are never lost
      flushPendingTranscript();

      // Clean up dead instance
      destroyRecognitionInstance();

      // Guard: Do NOT restart if user stopped listening or TTS is speaking
      if (!isUserListening || isTtsSuppressed || isTtsSpeaking()) {
        logLifecycle('onend', 'Not restarting: user not listening or TTS active');
        return;
      }

      // Safe exponential backoff delay to prevent restart loops
      const delay = consecutiveFailures === 0
        ? 50
        : Math.min(300 * Math.pow(2, consecutiveFailures - 1), 3000);

      logLifecycle('restart', `Scheduling restart in ${Math.round(delay)}ms (consecutiveFailures: ${consecutiveFailures})`);
      clearRestartTimeout();
      restartTimeoutId = setTimeout(() => {
        restartTimeoutId = null;
        if (isUserListening && !isTtsSuppressed && !isTtsSpeaking()) {
          startRecognitionSession();
        }
      }, delay);
    };

    logLifecycle('start', 'Calling recognition.start()');
    recognition.start();
  } catch (err) {
    logLifecycle('startException', `Exception calling recognition.start(): ${err?.message || err}`);
    consecutiveFailures++;
    sessionState = 'IDLE';
    if (isUserListening && consecutiveFailures < 5) {
      clearRestartTimeout();
      restartTimeoutId = setTimeout(() => {
        restartTimeoutId = null;
        if (isUserListening) {
          startRecognitionSession();
        }
      }, 500);
    } else if (consecutiveFailures >= 5) {
      isUserListening = false;
      if (typeof activeOnError === 'function') {
        activeOnError('START_FAILED');
      }
    }
  }
}

// Global TTS suppression subscriber: prevents mic from capturing speaker audio
subscribeTtsState((ttsActive) => {
  if (ttsActive) {
    isTtsSuppressed = true;
    logLifecycle('ttsState', 'TTS became active, suppressing STT capture');
    clearRecoveryTimeout();
    clearPauseTimeout();
    clearRestartTimeout();
    clearMaxDurationTimeout();
    flushPendingTranscript();
    destroyRecognitionInstance();
  } else {
    logLifecycle('ttsState', 'TTS finished, scheduling STT recovery');
    clearRecoveryTimeout();
    recoveryTimeoutId = setTimeout(() => {
      isTtsSuppressed = false;
      recoveryTimeoutId = null;
      if (isUserListening && !recognition) {
        consecutiveFailures = 0;
        logLifecycle('ttsRecovery', 'Resuming STT after TTS recovery delay');
        startRecognitionSession();
      }
    }, TTS_RECOVERY_DELAY_MS);
  }
});

export function startListening(onResult, onError) {
  logLifecycle('startListening', 'API call to start listening');
  isUserListening = true;
  consecutiveFailures = 0;
  activeOnResult = onResult;
  activeOnError = onError;

  // If TTS is currently speaking or settling, wait for TTS recovery subscriber to engage
  if (isTtsSuppressed || isTtsSpeaking()) {
    logLifecycle('startListening', 'TTS is currently active/settling; waiting for TTS recovery');
    return;
  }

  startRecognitionSession();
}

export function stopListening() {
  logLifecycle('stopListening', 'API call to stop listening');
  isUserListening = false;
  consecutiveFailures = 0;

  clearRestartTimeout();
  clearRecoveryTimeout();
  clearPauseTimeout();
  clearMaxDurationTimeout();

  flushPendingTranscript();
  destroyRecognitionInstance();

  activeOnResult = null;
  activeOnError = null;
}

export default {
  startListening,
  stopListening,
  PAUSE_THRESHOLD_MS,
  TTS_RECOVERY_DELAY_MS,
  MAX_SESSION_DURATION_MS,
};
