const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const FINAL_TIMEOUT_MS = 4000;

const ERROR_MAP = {
  "not-allowed": "PERMISSION_DENIED",
  "no-speech": "NO_SPEECH_DETECTED",
  "network": "NETWORK_ERROR",
};

let recognition = null;
let isListening = false;
let safetyTimeoutId = null;
let lastKnownTranscript = null;

function clearSafetyTimeout() {
  if (safetyTimeoutId) {
    clearTimeout(safetyTimeoutId);
    safetyTimeoutId = null;
  }
}

export function startListening(onResult, onError) {
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
    recognition.stop();
  }

  clearSafetyTimeout();
  lastKnownTranscript = null;
  isListening = true;

  recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const latestResult = event.results[event.results.length - 1];
    if (latestResult && latestResult[0]) {
      const text = latestResult[0].transcript;
      const isFinal = latestResult.isFinal;

      clearSafetyTimeout();

      if (isFinal) {
        lastKnownTranscript = null;
      } else {
        lastKnownTranscript = text;
        safetyTimeoutId = setTimeout(() => {
          if (isListening && lastKnownTranscript) {
            if (typeof onResult === "function") {
              onResult({
                text: lastKnownTranscript,
                isFinal: true,
                timestamp: Date.now(),
              });
            }
            lastKnownTranscript = null;
            safetyTimeoutId = null;
          }
        }, FINAL_TIMEOUT_MS);
      }

      if (typeof onResult === "function") {
        onResult({
          text,
          isFinal,
          timestamp: Date.now(),
        });
      }
    }
  };

  recognition.onerror = (event) => {
    if (typeof onError === "function" && event && event.error) {
      const mappedCode = ERROR_MAP[event.error];
      if (mappedCode) {
        onError(mappedCode);
      }
    }
  };

  recognition.onend = () => {
    if (isListening) {
      try {
        recognition.start();
      } catch (err) {
        // Prevents uncaught exceptions if restart fails
      }
    }
  };

  recognition.start();
}

export function stopListening() {
  isListening = false;
  clearSafetyTimeout();
  lastKnownTranscript = null;
  if (recognition) {
    recognition.stop();
  }
}
