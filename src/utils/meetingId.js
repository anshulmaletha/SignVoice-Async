/**
 * meetingId.js
 * Utility for generating, validating, and formatting SignVoice meeting identifiers.
 * Format: SV-XXXXXX (e.g. SV-7K4P2A)
 */

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a unique, human-readable meeting ID with an 'SV-' prefix.
 * Avoids ambiguous characters (0, O, 1, I).
 *
 * @returns {string} Meeting ID (e.g. "SV-7K4P2A")
 */
export function generateMeetingId() {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    result += CHARS[randomIndex];
  }
  return `SV-${result}`;
}

/**
 * Validates whether a given string is a valid SignVoice meeting ID.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isValidMeetingId(id) {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim().toUpperCase();
  return /^SV-[A-Z0-9]{4,10}$/.test(trimmed);
}

/**
 * Generates the full shareable URL for a given meeting ID.
 *
 * @param {string} meetingId
 * @returns {string} Absolute URL (e.g. "https://signvoice.app/meeting/SV-7K4P2A")
 */
export function getMeetingUrl(meetingId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanId = (meetingId || '').trim();
  return `${origin}/meeting/${cleanId}`;
}

export default {
  generateMeetingId,
  isValidMeetingId,
  getMeetingUrl,
};
