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

/**
 * Maps a raw MediaPipe gesture detection result to the frozen SignVoice GESTURE_OUTPUT contract.
 *
 * Case 1: No hand detected -> gesture: "NONE", text: "", confidence: 0
 * Case 2: Supported gesture -> gesture: "<CODE>", text: "<Text>", confidence: score
 * Case 3: Unsupported gesture -> gesture: "UNKNOWN", text: "Gesture not recognized", confidence: score
 *
 * @param {string} categoryName - Raw category name from MediaPipe (or 'None' / empty).
 * @param {number} [score=0] - MediaPipe confidence score (0.0 to 1.0).
 * @param {number} [timestamp=Date.now()] - Timestamp in milliseconds.
 * @returns {{ gesture: string, text: string, confidence: number, timestamp: number }}
 */
export function mapGesture(categoryName, score = 0, timestamp = Date.now()) {
  // Case 1: No hand detected
  if (!categoryName || categoryName === 'None') {
    return {
      gesture: 'NONE',
      text: '',
      confidence: 0,
      timestamp
    };
  }

  // Check if category exists in frozen 5-gesture dictionary
  const matched = GESTURE_MAP[categoryName];
  if (matched) {
    return {
      gesture: matched.gesture,
      text: matched.text,
      confidence: typeof score === 'number' ? score : 0,
      timestamp
    };
  }

  // Case 2: Hand detected but unsupported gesture
  return {
    gesture: 'UNKNOWN',
    text: 'Gesture not recognized',
    confidence: typeof score === 'number' ? score : 0,
    timestamp
  };
}

export default {
  GESTURE_MAP,
  mapGesture
};
