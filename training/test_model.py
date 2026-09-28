import os
import sys
import json
import argparse
import joblib
import numpy as np
import cv2
import mediapipe as mp

# Allow importing from training package if executed directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from training.utils import (
    create_hand_landmarker,
    extract_landmarks,
    normalize_landmarks,
    draw_hand_landmarks,
)

CONFIDENCE_THRESHOLD = 0.60

def parse_args():
    parser = argparse.ArgumentParser(description="SignVoice Custom Gesture Test & Prediction Script")
    parser.add_argument(
        "--model",
        type=str,
        default="models/gesture_model.pkl",
        help="Path to trained model pickle file (default: models/gesture_model.pkl)",
    )
    parser.add_argument(
        "--labels",
        type=str,
        default="models/labels.json",
        help="Path to gesture labels json file (default: models/labels.json)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=CONFIDENCE_THRESHOLD,
        help=f"Confidence threshold for UNKNOWN classification (default: {CONFIDENCE_THRESHOLD})",
    )
    return parser.parse_args()

def main():
    args = parse_args()
    model_path = os.path.abspath(args.model)
    labels_path = os.path.abspath(args.labels)
    threshold = args.threshold

    if not os.path.exists(model_path) or not os.path.exists(labels_path):
        print("\nError: Trained model or labels file not found!")
        print(f"  Missing: {model_path if not os.path.exists(model_path) else labels_path}")
        print("  Please run python training/train_model.py first.\n")
        sys.exit(1)

    print("\n==========================================")
    print("  SignVoice Real-Time Gesture Test")
    print("==========================================")
    print(f"Loading model:  {model_path}")
    print(f"Loading labels: {labels_path}")
    print(f"Confidence Threshold: {threshold}")
    print("Initializing MediaPipe HandLandmarker detector...")

    classifier = joblib.load(model_path)
    with open(labels_path, "r", encoding="utf-8") as f:
        labels = json.load(f)

    detector = create_hand_landmarker(num_hands=1)

    print("Opening webcam... Press 'Q' or ESC to Exit.\n")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        sys.exit(1)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to grab webcam frame.")
            break

        # Mirror webcam feed horizontally
        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = detector.detect(mp_image)

        predicted_gesture = "NONE"
        confidence = 0.0

        if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
            hand_landmarks = detection_result.hand_landmarks[0]
            
            # Draw hand landmarks skeleton
            draw_hand_landmarks(frame, hand_landmarks)

            # Extract and normalize landmarks (EXACT same preprocessing)
            raw_coords = extract_landmarks(hand_landmarks)
            normalized_features = normalize_landmarks(raw_coords).reshape(1, -1)

            # Predict gesture probabilities
            probabilities = classifier.predict_proba(normalized_features)[0]
            max_idx = np.argmax(probabilities)
            max_prob = probabilities[max_idx]

            if max_prob >= threshold:
                predicted_gesture = classifier.classes_[max_idx]
                confidence = float(max_prob)
            else:
                predicted_gesture = "UNKNOWN"
                confidence = float(max_prob)

        # Display results overlay
        cv2.rectangle(frame, (0, 0), (w, 90), (30, 30, 30), -1)

        gesture_color = (0, 255, 0) if predicted_gesture not in ["NONE", "UNKNOWN"] else (0, 165, 255)
        if predicted_gesture == "UNKNOWN":
            gesture_color = (0, 0, 255)

        cv2.putText(
            frame,
            f"Gesture: {predicted_gesture}",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            gesture_color,
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            f"Confidence: {confidence:.2f}",
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        # Controls footer
        cv2.putText(
            frame,
            "Press 'Q' or ESC to Quit",
            (20, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
            cv2.LINE_AA,
        )

        cv2.imshow("SignVoice Custom Gesture Classifier", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27:
            print("[Test] Exiting prediction test...")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[Test] Cleanup complete.")

if __name__ == "__main__":
    main()
