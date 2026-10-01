/**
 * mockSpeechData.js
 * Deterministic mock speech-recognition stream for Day 1 testing (Task B3).
 * Simulates the sentence "How are you today" with interim results resolving
 * to one final result with ~800ms natural pause finalization.
 */

const SCRIPTED_STEPS = [
  { text: "How", isFinal: false, offsetMs: 250 },
  { text: "How are", isFinal: false, offsetMs: 500 },
  { text: "How are you", isFinal: false, offsetMs: 750 },
  { text: "How are you today", isFinal: false, offsetMs: 1000 },
  { text: "How are you today", isFinal: true, offsetMs: 1800 },
];

const CYCLE_DURATION_MS = 4500;

let intervalId = null;
let timeoutIds = [];

function clearAllTimers() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  timeoutIds.forEach((id) => clearTimeout(id));
  timeoutIds = [];
}

function runCycle(onResult) {
  SCRIPTED_STEPS.forEach((step) => {
    const tid = setTimeout(() => {
      if (typeof onResult === "function") {
        onResult({
          text: step.text,
          isFinal: step.isFinal,
          timestamp: Date.now(),
        });
      }
    }, step.offsetMs);
    timeoutIds.push(tid);
  });
}

export function startMockSpeechStream(onResult) {
  clearAllTimers();

  runCycle(onResult);

  intervalId = setInterval(() => {
    timeoutIds = [];
    runCycle(onResult);
  }, CYCLE_DURATION_MS);
}

export function stopMockSpeechStream() {
  clearAllTimers();
}
