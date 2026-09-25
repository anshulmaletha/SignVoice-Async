/**
 * Frozen SignVoice 5-Gesture Mapping Dictionary
 * Maps MediaPipe raw category names to SignVoice GESTURE_OUTPUT format.
 */
export const GESTURE_MAP = Object.freeze({
  Open_Palm: {
    gesture: 'HELLO',
    text: 'Hello'
  },
  Thumb_Up: {
    gesture: 'YES',
    text: 'Yes'
  },
  Thumb_Down: {
    gesture: 'NO',
    text: 'No'
  },
  Victory: {
    gesture: 'HELP',
    text: 'Help'
  },
  ILoveYou: {
    gesture: 'THANK_YOU',
    text: 'Thank you'
  }
});

// Named constant for minimum confidence threshold (Task A5)
// Classifications with score < CONFIDENCE_THRESHOLD fall back to UNKNOWN
export const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Maps a raw MediaPipe gesture detection result to the frozen SignVoice GESTURE_OUTPUT contract.
 *
 * Case 1: No hand detected -> gesture: "NONE", text: "", confidence: 0
 * Case 2: Hand detected but confidence < CONFIDENCE_THRESHOLD -> gesture: "UNKNOWN", text: "Gesture not recognized", confidence: score
 * Case 3: Supported gesture with confidence >= CONFIDENCE_THRESHOLD -> gesture: "<CODE>", text: "<Text>", confidence: score
 * Case 4: Unsupported gesture -> gesture: "UNKNOWN", text: "Gesture not recognized", confidence: score
 *
 * @param {string} categoryName - Raw category name from MediaPipe (or 'None' / empty).
 * @param {number} [score=0] - MediaPipe confidence score (0.0 to 1.0).
 * @param {string|number} [timestamp=new Date().toLocaleTimeString()] - Human-readable time string.
 * @returns {{ gesture: string, text: string, confidence: number, timestamp: string }}
 */
export function mapGesture(categoryName, score = 0, timestamp = new Date().toLocaleTimeString()) {
  const numericScore = typeof score === 'number' ? score : 0;
  const timeString = typeof timestamp === 'string' ? timestamp : new Date().toLocaleTimeString();

  // Case 1: No hand detected
  if (!categoryName || categoryName === 'None') {
    return {
      gesture: 'NONE',
      text: '',
      confidence: 0,
      timestamp: timeString
    };
  }

  // Task A5: Confidence gate - fall back to UNKNOWN if score is below threshold
  if (numericScore < CONFIDENCE_THRESHOLD) {
    return {
      gesture: 'UNKNOWN',
      text: 'Gesture not recognized',
      confidence: numericScore,
      timestamp: timeString
    };
  }

  // Check if category exists in frozen 5-gesture dictionary
  const matched = GESTURE_MAP[categoryName];
  if (matched) {
    return {
      gesture: matched.gesture,
      text: matched.text,
      confidence: numericScore,
      timestamp: timeString
    };
  }

  // Case 4: Hand detected but unsupported gesture
  return {
    gesture: 'UNKNOWN',
    text: 'Gesture not recognized',
    confidence: numericScore,
    timestamp: timeString
  };
}

export default {
  GESTURE_MAP,
  CONFIDENCE_THRESHOLD,
  mapGesture
};
