const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

let recognition = null;
let isListening = false;

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
      onError(event.error);
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
  if (recognition) {
    recognition.stop();
  }
}
