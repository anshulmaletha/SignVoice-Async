/**
 * sessionService.js
 * Generates and stores a unique anonymous session ID for the meeting participant.
 * Uses sessionStorage so each browser tab/window gets a distinct participant identity.
 */

const STORAGE_KEY = 'signvoice_meeting_session_id';

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return 'server_session';

  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    sessionId = `usr_${randomHex}`;
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function clearSessionId() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export default {
  getOrCreateSessionId,
  clearSessionId,
};
