import React, { useEffect, useRef, useState } from 'react';
import { startGestureRecognition } from './gesture/GestureRecognizer';

export default function App() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState(null);
  const [currentGesture, setCurrentGesture] = useState({ categoryName: 'None', score: 0 });
  const recognitionControlRef = useRef(null);
  const streamRef = useRef(null);

  const startWebcamAndRecognition = async () => {
    try {
      setError(null);
      setStatus('Requesting camera permission...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (navigator.mediaDevices.getUserMedia) not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('Video element reference is missing.');
      }

      videoRef.current.srcObject = stream;
      setStatus('Waiting for video stream...');

      await new Promise((resolve) => {
        if (videoRef.current.readyState >= 2) {
          resolve();
        } else {
          videoRef.current.onloadeddata = () => resolve();
        }
      });

      await videoRef.current.play();
      setStatus('Loading MediaPipe GestureRecognizer model...');

      const control = await startGestureRecognition(
        videoRef.current,
        (rawResult) => {
          // Callback receives raw result: { categoryName, score }
          setCurrentGesture(rawResult);
        },
        {
          logIntervalMs: 300,
          enableConsoleLogging: true
        }
      );

      recognitionControlRef.current = control;
      setStatus('Running (Check Browser Console)');
    } catch (err) {
      console.error('[GestureRecognizer] Camera or initialization error:', err);
      let message = err.message || 'Unknown error occurred.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission denied.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Camera unavailable or not found.';
      }
      setError(`[GestureRecognizer] ${message}`);
      setStatus('Error');
    }
  };

  const stopWebcamAndRecognition = () => {
    if (recognitionControlRef.current) {
      recognitionControlRef.current.stop();
      recognitionControlRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('Stopped');
    setCurrentGesture({ categoryName: 'None', score: 0 });
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recognitionControlRef.current) {
        recognitionControlRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>SignVoice — Task A1 Test Harness (Console Only)</h2>
      <p>
        <strong>Status:</strong> {status}
      </p>
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={startWebcamAndRecognition}
          style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}
        >
          Start Webcam & Recognizer
        </button>
        <button
          onClick={stopWebcamAndRecognition}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Stop
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '480px',
            height: '360px',
            backgroundColor: '#000',
            border: '1px solid #ccc'
          }}
        />
        <div
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            backgroundColor: '#f9f9f9',
            minWidth: '240px'
          }}
        >
          <h4>Current Raw Output</h4>
          <p>
            <strong>categoryName:</strong> {currentGesture.categoryName}
          </p>
          <p>
            <strong>score:</strong> {currentGesture.score.toFixed(2)}
          </p>
          <small>Open DevTools Console (F12) for real-time logs.</small>
        </div>
      </div>
    </div>
  );
}
