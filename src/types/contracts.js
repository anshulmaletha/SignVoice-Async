//  Shared contract between gesture, speech, and UI.

/** @typedef {"HELLO"|"YES"|"NO"|"HELP"|"THANK_YOU"|"STOP"|"UNKNOWN"|"NONE"} SupportedGesture */
export const SUPPORTED_GESTURES = ['HELLO', 'YES', 'NO', 'HELP', 'THANK_YOU', 'STOP', 'UNKNOWN', 'NONE']

/** @typedef {Object} GestureOutput
 * @property {SupportedGesture} gesture
 * @property {string} text
 * @property {number} confidence
 * @property {number} timestamp */
export const GESTURE_OUTPUT_EXAMPLE = { gesture: 'HELLO', text: 'Hello', confidence: 0.91, timestamp: 1732300000000 }

/** @typedef {Object} SpeechOutput
 * @property {string} text
 * @property {boolean} isFinal
 * @property {number} timestamp */
export const SPEECH_OUTPUT_EXAMPLE = { text: 'How are you today', isFinal: false, timestamp: 1732300000000 }

/** @typedef {Object} ConversationMessage
 * @property {string} id
 * @property {"sign_user"|"speech_user"} sender
 * @property {string} text
 * @property {"sign"|"speech"} type
 * @property {number} timestamp */
export const CONVERSATION_MESSAGE_EXAMPLE = { id: 'msg_17', sender: 'sign_user', text: 'Hello', type: 'sign', timestamp: 1732300000000 }

/** TTS call: TextToSpeech.speak("Hello"); // returns void */
/** @typedef {"PERMISSION_DENIED"|"NO_SPEECH_DETECTED"|"NETWORK_ERROR"} SpeechErrorCode */
