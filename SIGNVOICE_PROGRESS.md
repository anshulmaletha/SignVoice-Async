# SignVoice Progress Checkpoint Report

*Generated: 2026-09-30*
*Status: Local & Uncommitted Checkpoint*

---

## Phase 1 — Architecture & Environment Audit
- Full architectural analysis of the SignVoice codebase completed.
- Evaluated existing single-device vision (`SignUserPanel`, `useVisionPipeline`, `GestureRecognizer`) and speech (`SpeechUserPanel`, `SpeechToText`, `TextToSpeech`) stacks.
- Inspected Supabase integration, environment configuration, and Vite dev server setup.

---

## Phase 2 — Meeting Infrastructure & Routing
- Dynamic meeting route support for `/meeting/:meetingId`.
- Meeting ID generator formatted as `SV-XXXXXX` (`src/utils/meetingId.js`).
- Meeting Room base UI and controls layout (`src/components/meeting/MeetingRoom.jsx`, `src/styles/meeting.css`).
- Clipboard copy utility for meeting links with interactive user feedback.
- Post-login Dashboard entry point: Prominent `Start Meeting` primary action button (`src/views/DashboardView.jsx`).
- Clean Public Landing Page: No meeting creation CTA on public view before login (`src/components/LandingPage.jsx`).
- Seamless flow: Login → Dashboard → Start Meeting → `/meeting/:meetingId`.

---

## Phase 3 — Two-Person Native WebRTC Calling
- **Supabase Realtime Signaling**: Channel-based Presence and Broadcast signaling per room (`signaling:SV-XXXXXX`).
- **Native WebRTC PeerConnection**: Native browser `RTCPeerConnection` for low-latency peer-to-peer audio and video transmission.
- **Signaling Exchange**: Symmetric offer/answer exchange with ICE candidate trickling.
- **Early Signaling Queue**: Buffered signal queue (`signalQueueRef`) preventing dropped early offers/answers during peer initialization.
- **Deterministic Role Assignment**: Lexicographical comparison of participant IDs for polite/impolite glare handling.
- **Presence Jitter Grace Period**: 3.5-second disconnect debounce preventing premature connection teardown on momentary presence drops.
- **Dedicated Remote Media Elements**: Distinct hidden `<audio autoPlay playsInline />` element ensuring reliable remote voice playback.
- **In-Call Hardware Controls**: Local camera on/off toggle, microphone mute/unmute toggle, audio output mute, and leave meeting.
- **Capacity Management**: Room capped at two active participants with automatic rejection/notification for third participants.
- **Connection Stability**: Reliable `Connected` ICE and peer connection state.
- **Video Stream Tuning**:
  - Outbound video capped at 1.2 Mbps max bitrate.
  - Framerate locked to 25 FPS with `maintain-framerate` degradation preference.
  - Video capture constrained to 640x480 for smooth performance over tunnels and real networks.
- **Real-Device Testing**: Confirmed working across two separate laptops over Cloudflare tunnel with bidirectional video and audio.

---

## Phase 4 — SignVoice Communication Integration (COMPLETED & VERIFIED)
- **Sign → Text**:
  - Continuous MediaPipe `GestureRecognizer` processing on local camera feed.
  - Supported signs detected with stabilization and hold debounce (`STABLE_FRAME_THRESHOLD = 15`).
  - Active detected sign pill on local video card (`🤟 Sign: <GESTURE>`).
  - Broadcast via room signaling (`{ type: 'sign', gesture, text }`).
  - Remote participant renders `🤟 [Sign] Friend: <GESTURE>`.
- **Incoming Sign → TTS**:
  - Receiver triggers browser `TextToSpeech.speak(signText)` automatically upon incoming sign.
  - Respects user's `ttsEnabled` toggle setting.
  - Outgoing local signs do NOT trigger local TTS.
- **Speech → Text**:
  - Dedicated speech transcription toggle in Meeting Controls bar (`[🗣️ Speech ON/OFF]`).
  - Real-time interim captions display on local video card overlay (`🗣️ "<INTERIM>"`).
  - Finalized transcripts deduplicated and broadcast via room signaling (`{ type: 'speech', text }`).
  - Remote participant renders `🗣️ [Speech] Friend: <SPEECH>`.
  - Incoming speech messages do NOT trigger TTS.
- **Typed Text Chat**:
  - Chat input in right-column Communication Feed.
  - Empty messages blocked.
  - Messages broadcast via room signaling (`{ type: 'chat', text }`).
  - Sender sees `💬 [Text] You: <MESSAGE>`.
  - Remote peer immediately sees `💬 [Text] Friend: <MESSAGE>`.
- **Unified Conversation Feed**:
  - Chronological rendering of Sign, Speech, and Typed Text messages with distinct tags and visual styling.
  - Clear sender distinction (`You` vs `Friend`).
  - Auto-scroll to latest message on incoming entries.
  - Messages recorded into `conversationStore` for session history continuity.
- **Two-Session Acceptance Testing**:
  - End-to-end automation across two headless browser sessions confirmed 100% pass rate:
    - Typed message "Hello" transmitted and received: PASS
    - Sign "HELLO" detected, transmitted, received, and spoken via TTS: PASS
    - Speech "How are you?" transcribed, transmitted, received, no TTS echo: PASS
    - Camera toggle, Mic toggle, Speech toggle: PASS
    - Leave meeting return flow: PASS
    - Production build (`npm run build`) clean: PASS

---

## Dashboard & Navigation Update
- Post-login Dashboard features the primary `Start Meeting` button with subtle warm glow styling (`GlowActionButton`).
- Public Landing Page (`/`) contains no `Create Meeting` or `Start Meeting` buttons.
- Build verified (`npm run build` succeeds cleanly).
- All changes kept local and uncommitted.

---

## Phase 5 — Reliability, Edge Cases & Final Polish (COMPLETED & VERIFIED)
- **Edge Case Hardening**:
  - **Camera Off**: Disables video track, stops MediaPipe gesture recognition engine, renders camera-off avatar placeholder, broadcasts media state to remote peer.
  - **Mic Muted**: Disables audio track, broadcasts mute status to remote peer, displays "• Muted" indicator on user pills.
  - **Remote Peer Disconnect**: 3.5-second presence grace timer prevents premature teardown on network jitter; gracefully cleans up peer session and displays waiting screen if peer exits.
  - **Late Joiner**: Deterministic offer/answer signaling exchange with early signal queue ensures reliable connection regardless of join timing.
  - **Third Participant Rejection**: Immediate hardware track release (`track.stop()`) on room full event, prevents webcam light from lingering; renders clean "Meeting Room Full" lock card with "Return to Home" button.
  - **Audio Autoplay Policy**: Dedicated audio element autoPlay handling with fallback interactive banner when browser autoplay policy blocks sound.
  - **Clean Room Teardown**: Comprehensive unmount cleanup stops all tracks, peer sessions, channel subscriptions, and gesture/speech recognition loops without resource leaks.
  - **Signaling Reconnection & Error Banner**: Realtime error callback (`CHANNEL_ERROR` / `TIMED_OUT`) updates connection state and displays a non-intrusive reconnection alert banner; self-heals when presence resumes.
  - **Speech API Compatibility Check**: Verifies `window.SpeechRecognition || window.webkitSpeechRecognition` prior to starting transcription; gracefully warns user in unsupported browsers (e.g. Firefox) without throwing exceptions.
- **Responsive Mobile Layout**:
  - Added `@media (max-width: 600px)` rules in `meeting.css` for flexible header wrapping, compact 48px controls buttons, and flex-wrap layout preventing overflow on narrow screens.
- **Production Build Verification**:
  - Clean production build (`npm run build`) in 2.66s with zero errors or warnings.
- **Acceptance Automation**:
  - End-to-end two-browser suite verified all communication channels, media toggles, and leave flows with 100% pass rate.

---

## Current Repository & Git State
- **Branch**: `int` (up to date with `origin/int`).
- **Git Status**:
  - `modified: package.json`
  - `modified: package-lock.json`
  - `modified: src/App.jsx`
  - `modified: src/views/DashboardView.jsx`
  - `modified: vite.config.js`
  - `untracked: .env`
  - `untracked: .env.txt`
  - `untracked: SIGNVOICE_PROGRESS.md`
  - `untracked: src/components/meeting/`
  - `untracked: src/services/sessionService.js`
  - `untracked: src/services/supabaseClient.js`
  - `untracked: src/services/webrtcManager.js`
  - `untracked: src/services/webrtcSignaling.js`
  - `untracked: src/styles/meeting.css`
  - `untracked: src/utils/meetingId.js`
- **Safety Policy**: Strictly NO git commits, NO git pushes, NO pull requests, NO merges, and NO deployments. All work remains local and uncommitted.
