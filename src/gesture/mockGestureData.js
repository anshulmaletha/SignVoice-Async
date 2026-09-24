/**
 * Deterministic Mock Gesture Data Stream for Frontend Development (Task A3).
 *
 * Emits GESTURE_OUTPUT contract objects every 3 seconds cycling through:
 * HELLO -> YES -> NO -> HELP -> THANK_YOU -> UNKNOWN -> NONE -> repeat
 */

/**
 * Frozen mock gesture sequence template.
 * Matches the frozen SignVoice GESTURE_OUTPUT contract from Task A2.
 */
export const MOCK_GESTURE_SEQUENCE = Object.freeze([
  {
    gesture: 'HELLO',
    text: 'Hello',
    confidence: 0.95
  },
  {
    gesture: 'YES',
    text: 'Yes',
    confidence: 0.92
  },
  {
    gesture: 'NO',
    text: 'No',
    confidence: 0.90
  },
  {
    gesture: 'HELP',
    text: 'Help',
    confidence: 0.93
  },
  {
    gesture: 'THANK_YOU',
    text: 'Thank you',
    confidence: 0.91
  },
  {
    gesture: 'UNKNOWN',
    text: 'Gesture not recognized',
    confidence: 0.85
  },
  {
    gesture: 'NONE',
    text: '',
    confidence: 0
  }
]);

let activeIntervalId = null;
let currentIndex = 0;

/**
 * Stops the active mock gesture stream if one is running.
 * Safe to call when already stopped or uninitialized.
 */
export function stopMockGestureStream() {
  if (activeIntervalId !== null) {
    clearInterval(activeIntervalId);
    activeIntervalId = null;
    console.log('[MockGestureData] Mock gesture stream stopped.');
  }
}

/**
 * Starts a repeating mock gesture data stream.
 * Emits one GESTURE_OUTPUT object every 3 seconds (3000ms) by default.
 *
 * Contract produced:
 * {
 *   gesture: string,
 *   text: string,
 *   confidence: number,
 *   timestamp: number
 * }
 *
 * @param {Function} onResult - Callback receiving GESTURE_OUTPUT on each interval tick.
 * @param {number} [intervalMs=3000] - Interval duration in milliseconds (defaults to 3000ms).
 * @param {boolean} [emitImmediately=false] - Whether to emit the first item immediately before starting the interval.
 * @returns {{ stop: Function, isRunning: Function }} Control object to manage the stream.
 */
export function startMockGestureStream(onResult, intervalMs = 3000, emitImmediately = false) {
  if (typeof onResult !== 'function') {
    throw new Error('[MockGestureData] A valid callback function must be provided to startMockGestureStream.');
  }

  // Prevent duplicate intervals if already running
  stopMockGestureStream();

  currentIndex = 0;

  const emitNext = () => {
    const item = MOCK_GESTURE_SEQUENCE[currentIndex];
    currentIndex = (currentIndex + 1) % MOCK_GESTURE_SEQUENCE.length;

    const gestureOutput = {
      gesture: item.gesture,
      text: item.text,
      confidence: item.confidence,
      timestamp: Date.now()
    };

    console.log(
      `[MockGestureData] gesture: ${gestureOutput.gesture} (${gestureOutput.text}) | confidence: ${gestureOutput.confidence.toFixed(2)}`
    );

    try {
      onResult(gestureOutput);
    } catch (err) {
      console.error('[MockGestureData] Error in onResult callback:', err);
    }
  };

  if (emitImmediately) {
    emitNext();
  }

  activeIntervalId = setInterval(emitNext, intervalMs);
  console.log(`[MockGestureData] Mock gesture stream started (cadence: ${intervalMs}ms).`);

  return {
    stop: stopMockGestureStream,
    isRunning: () => activeIntervalId !== null
  };
}

export default {
  MOCK_GESTURE_SEQUENCE,
  startMockGestureStream,
  stopMockGestureStream
};
