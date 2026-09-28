import os
import sys
import time
import argparse
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

SUPPORTED_GESTURES = ["WATER", "FOOD", "GOODBYE", "PLEASE", "SORRY"]

def parse_args():
    parser = argparse.ArgumentParser(description="SignVoice Custom Gesture Data Collector")
    parser.add_argument(
        "--gesture",
        type=str,
        default=None,
        help="Gesture label to collect (e.g. WATER, FOOD, GOODBYE, PLEASE, SORRY)",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=30,
        help="Number of samples to collect (default: 30)",
    )
    parser.add_argument(
        "--dataset_dir",
        type=str,
        default="dataset",
        help="Target folder to save dataset samples (default: dataset)",
    )
    return parser.parse_args()

def select_gesture(args):
    gesture = args.gesture
    if gesture:
        gesture = gesture.strip().upper()
    else:
        print("\n==========================================")
        print("  SignVoice Custom Gesture Collector")
        print("==========================================")
        print("Select a gesture to collect:")
        for idx, name in enumerate(SUPPORTED_GESTURES, 1):
            print(f"  {idx}. {name}")
        print("  Or type a custom gesture name.")
        print("==========================================")
        user_input = input("Enter choice (1-5 or gesture name): ").strip()
        
        if user_input.isdigit():
            choice_idx = int(user_input) - 1
            if 0 <= choice_idx < len(SUPPORTED_GESTURES):
                gesture = SUPPORTED_GESTURES[choice_idx]
            else:
                gesture = f"GESTURE_{user_input}"
        elif user_input:
            gesture = user_input.upper()
        else:
            gesture = "WATER"
            
    return gesture

def main():
    args = parse_args()
    gesture = select_gesture(args)
    target_samples = args.samples
    dataset_base_dir = os.path.abspath(args.dataset_dir)
    gesture_dir = os.path.join(dataset_base_dir, gesture)
    
    os.makedirs(gesture_dir, exist_ok=True)

    # Initialize preset folders for 5 gestures if missing
    for g in SUPPORTED_GESTURES:
        os.makedirs(os.path.join(dataset_base_dir, g), exist_ok=True)

    # Count existing samples
    existing_samples = [f for f in os.listdir(gesture_dir) if f.endswith(".npy")]
    sample_count = len(existing_samples)

    print(f"\n[Collector] Gesture target: '{gesture}'")
    print(f"[Collector] Existing samples in {gesture_dir}: {sample_count}")
    print(f"[Collector] Target new samples: {target_samples}")
    print("[Collector] Initializing MediaPipe HandLandmarker detector...")

    detector = create_hand_landmarker(num_hands=1)

    window_name = f"SignVoice Custom Gesture Collector - {gesture}"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 960, 720)
    cv2.moveWindow(window_name, 100, 100)

    print("[Collector] Opening webcam...")
    
    # Try DirectShow backend first on Windows for faster initialization
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[Collector] ERROR: Could not open webcam.")
        cv2.destroyAllWindows()
        sys.exit(1)

    print("[Collector] Webcam opened successfully.")
    print("[Collector] Controls: Press 'S' to Start/Pause collection, 'Q' or ESC to Quit.\n")

    print("[Collector] Frame capture loop started.")

    is_collecting = False
    collected_in_session = 0
    last_save_time = 0.0
    save_interval = 0.15  # seconds between frame saves during continuous mode
    first_frame_logged = False
    window_displayed_logged = False

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[Collector] ERROR: Could not read frame from webcam.")
            break

        if not first_frame_logged:
            print("[Collector] First frame captured.")
            first_frame_logged = True

        # Flip horizontally for mirrored view
        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        hand_detected = False
        normalized_features = None

        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = detector.detect(mp_image)

            if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
                hand_detected = True
                hand_landmarks = detection_result.hand_landmarks[0]
                
                # Draw hand landmarks on screen
                draw_hand_landmarks(frame, hand_landmarks)

                # Extract and normalize landmarks
                raw_coords = extract_landmarks(hand_landmarks)
                normalized_features = normalize_landmarks(raw_coords)
        except Exception as det_err:
            print(f"[Collector] Detection warning: {det_err}")

        # Auto-save frame sample if collecting and interval passed
        now = time.time()
        if is_collecting and hand_detected and normalized_features is not None:
            if now - last_save_time >= save_interval:
                filename = f"sample_{int(now * 1000)}.npy"
                file_path = os.path.join(gesture_dir, filename)
                np.save(file_path, normalized_features)
                
                sample_count += 1
                collected_in_session += 1
                last_save_time = now

                if collected_in_session >= target_samples:
                    is_collecting = False
                    print(f"[Collector] Reached target of {target_samples} samples for session!")

        # Overlay UI Information on Webcam feed
        cv2.rectangle(frame, (0, 0), (w, 100), (30, 30, 30), -1)

        cv2.putText(
            frame,
            f"GESTURE: {gesture}",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 255),
            2,
            cv2.LINE_AA,
        )

        status_text = "COLLECTING..." if is_collecting else "PAUSED (Press 'S' to start)"
        status_color = (0, 255, 0) if is_collecting else (0, 165, 255)
        cv2.putText(
            frame,
            f"Status: {status_text}",
            (20, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            status_color,
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            f"Samples: {sample_count} (Session: {collected_in_session}/{target_samples})",
            (20, 90),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

        if not hand_detected:
            cv2.putText(
                frame,
                "No Hand Detected",
                (20, 130),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

        # Controls footer
        cv2.putText(
            frame,
            "Press 'S' to Start/Pause | Press 'Q' to Quit",
            (20, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
            cv2.LINE_AA,
        )

        # Display window explicitly
        cv2.imshow(window_name, frame)

        if not window_displayed_logged:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)
            cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 0)
            print("[Collector] OpenCV window displayed.")
            window_displayed_logged = True

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q') or key == 27:  # ESC or Q
            print("[Collector] Quitting data collection...")
            break
        elif key == ord('s') or key == ord('S'):
            is_collecting = not is_collecting
            if is_collecting:
                collected_in_session = 0
                print(f"[Collector] Started collection session for '{gesture}'. Target: {target_samples} samples.")
            else:
                print("[Collector] Collection paused.")

    cap.release()
    cv2.destroyAllWindows()
    print(f"\n[Collector] Total samples saved for '{gesture}': {sample_count}")
    print(f"[Collector] Data saved in directory: {gesture_dir}\n")

if __name__ == "__main__":
    main()
