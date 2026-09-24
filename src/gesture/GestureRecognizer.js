import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { mapGesture } from './gestureMap';

// Official MediaPipe hosted model and wasm paths
const MEDIAPIPE_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const GESTURE_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

let gestureRecognizerInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initializes and caches the MediaPipe GestureRecognizer instance in VIDEO mode.
 * Falls back to CPU delegate if GPU delegate is unsupported.
 * Prevents duplicate initializations.
 *
 * @returns {Promise<GestureRecognizer>}
 */
export async function initializeGestureRecognizer() {
  if (gestureRecognizerInstance) {
    return gestureRecognizerInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('[GestureRecognizer] Initializing MediaPipe FilesetResolver...');
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);

      console.log('[GestureRecognizer] Loading pretrained GestureRecognizer model...');
      try {
        gestureRecognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: GESTURE_MODEL_ASSET_PATH,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });
      } catch (gpuError) {
        console.warn('[GestureRecognizer] GPU delegate initialization failed, falling back to CPU:', gpuError);
        gestureRecognizerInstance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: GESTURE_MODEL_ASSET_PATH,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 2
        });
      }

      console.log('[GestureRecognizer] GestureRecognizer successfully initialized in VIDEO mode.');
      return gestureRecognizerInstance;
    } catch (err) {
      console.error('[GestureRecognizer] Initialization failure:', err);
      gestureRecognizerInstance = null;
      throw new Error(`[GestureRecognizer] Failed to initialize MediaPipe model: ${err.message || err}`);
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Starts continuous gesture recognition on an HTMLVideoElement.
 *
 * CONCEPTUAL INTERFACE:
 * startGestureRecognition(videoElement, onResult, options)
 *
 * @param {HTMLVideoElement} videoElement - Live HTML video element with webcam stream.
 * @param {Function} onResult - Callback receiving GESTURE_OUTPUT: { gesture: string, text: string, confidence: number, timestamp: number }.
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.logIntervalMs=300] - Interval to throttle console output (default 300ms).
 * @param {boolean} [options.enableConsoleLogging=true] - Whether to print formatted logs to console.
 * @returns {Promise<{ stop: Function, isRunning: Function }>} Control object to stop recognition.
 */
export async function startGestureRecognition(videoElement, onResult, options = {}) {
  const {
    logIntervalMs = 300,
    enableConsoleLogging = true
  } = options;

  if (!videoElement) {
    const errorMsg = '[GestureRecognizer] Invalid video element provided.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Step 4 & 10: Ensure recognizer is loaded
  const recognizer = await initializeGestureRecognizer();

  let isRunning = true;
  let animationFrameId = null;
  let lastVideoTime = -1;
  let lastTimestamp = 0;
  let lastLogTime = 0;
  let lastGesture = null;

  const processFrame = () => {
    if (!isRunning) {
      return;
    }

    try {
      // Step 8: Verify video ready state before attempting recognition
      if (
        videoElement.readyState >= 2 && // HAVE_CURRENT_DATA or higher
        !videoElement.paused &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        const currentTime = videoElement.currentTime;
        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;
          let timestamp = performance.now();
          if (timestamp <= lastTimestamp) {
            timestamp = lastTimestamp + 1;
          }
          lastTimestamp = timestamp;

          // Step 3 & 8: Call recognizeForVideo
          const results = recognizer.recognizeForVideo(videoElement, timestamp);

          // Step 5: Extract highest-ranked gesture category
          let categoryName = 'None';
          let score = 0;

          if (
            results &&
            results.gestures &&
            results.gestures.length > 0 &&
            results.gestures[0].length > 0
          ) {
            const topGesture = results.gestures[0][0];
            categoryName = topGesture.categoryName || 'None';
            score = typeof topGesture.score === 'number' ? topGesture.score : 0;
          }

          // Task A2: Map raw MediaPipe category to frozen GESTURE_OUTPUT contract
          const gestureResult = mapGesture(categoryName, score, Date.now());

          // Deliver GESTURE_OUTPUT to callback
          if (typeof onResult === 'function') {
            try {
              onResult(gestureResult);
            } catch (cbErr) {
              console.error('[GestureRecognizer] Error in onResult callback:', cbErr);
            }
          }

          // Step 9: Throttled console logging of mapped gesture output
          const now = performance.now();
          const gestureChanged = gestureResult.gesture !== lastGesture;
          if (
            enableConsoleLogging &&
            (gestureChanged || now - lastLogTime >= logIntervalMs)
          ) {
            console.log(
              `[GestureRecognizer] gesture: ${gestureResult.gesture} (${gestureResult.text}) | confidence: ${gestureResult.confidence.toFixed(2)}`
            );
            lastLogTime = now;
            lastGesture = gestureResult.gesture;
          }
        }
      }
    } catch (runtimeErr) {
      // Step 10: Do not let runtime recognition failure silently crash the animation loop
      console.error('[GestureRecognizer] Runtime recognition failure:', runtimeErr);
    }

    if (isRunning) {
      animationFrameId = requestAnimationFrame(processFrame);
    }
  };

  // Start the animation loop
  animationFrameId = requestAnimationFrame(processFrame);

  const stop = () => {
    isRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    console.log('[GestureRecognizer] Gesture recognition stopped.');
  };

  return {
    stop,
    isRunning: () => isRunning
  };
}

export default {
  initializeGestureRecognizer,
  startGestureRecognition
};
