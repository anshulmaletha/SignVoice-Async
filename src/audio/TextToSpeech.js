/**
 * TextToSpeech.js
 * Browser text-to-speech utility with cooldown (Task B4).
 * Speaks recognized gestures aloud, exactly once per new gesture,
 * never overlapping, with a 1200ms cooldown for the same text.
 */

export const COOLDOWN_MS = 1200;

let lastSpokenText = null;
let lastSpokenTime = 0;

/**
 * Speaks text using the browser SpeechSynthesis API.
 * - Stops any currently speaking utterance before speaking new text.
 * - Enforces a 1200ms cooldown for repeating the exact same text.
 * - Does not block different text from speaking immediately.
 *
 * @param {string} text The text to speak aloud.
 */
export function speak(text) {
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
    const utterance = new Utterance(trimmed);
    synth.speak(utterance);
  }
}

export default {
  speak,
  COOLDOWN_MS,
};
