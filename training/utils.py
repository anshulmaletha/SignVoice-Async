import os
import urllib.request
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import drawing_utils, HandLandmarksConnections

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "hand_landmarker.task")

def ensure_model_file():
    """
    Ensures that hand_landmarker.task model file exists locally.
    Downloads it from official MediaPipe storage if missing.
    """
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    if not os.path.exists(MODEL_PATH):
        print(f"[MediaPipe] Downloading hand_landmarker.task model file to '{MODEL_PATH}'...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("[MediaPipe] Model download complete.")
    return MODEL_PATH

def create_hand_landmarker(num_hands=1):
    """
    Creates and returns a MediaPipe HandLandmarker instance using the Tasks API.
    """
    model_file = ensure_model_file()
    base_options = python.BaseOptions(model_asset_path=model_file)
    options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=num_hands)
    return vision.HandLandmarker.create_from_options(options)

def extract_landmarks(hand_landmarks):
    """
    Extract raw x, y, z coordinates from a list of MediaPipe NormalizedLandmark objects.
    
    Args:
        hand_landmarks: List of 21 landmark objects (or NormalizedLandmarkList)
        
    Returns:
        np.ndarray: Shape (21, 3) raw coordinate array
    """
    if hasattr(hand_landmarks, 'landmark'):
        lms = hand_landmarks.landmark
    else:
        lms = hand_landmarks
        
    return np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32)

def normalize_landmarks(coords):
    """
    Normalize 21 hand landmarks to be translation-invariant (wrist origin)
    and scale-invariant (max distance unit magnitude).
    
    Args:
        coords: np.ndarray of shape (21, 3) or flat array of 63 values.
        
    Returns:
        np.ndarray: Flattened 1D numpy array of 63 normalized landmark floats.
    """
    coords = np.asarray(coords, dtype=np.float32).reshape(21, 3)
    
    # 1. Translation Invariance: Shift wrist (landmark 0) to origin (0, 0, 0)
    wrist = coords[0]
    relative_coords = coords - wrist
    
    # 2. Scale Invariance: Divide by max euclidean distance from wrist
    distances = np.linalg.norm(relative_coords, axis=1)
    max_dist = np.max(distances)
    
    if max_dist > 0:
        normalized_coords = relative_coords / max_dist
    else:
        normalized_coords = relative_coords
        
    return normalized_coords.flatten()

def draw_hand_landmarks(image, hand_landmarks):
    """
    Draw hand landmarks and connections on an OpenCV BGR frame.
    """
    if hasattr(hand_landmarks, 'landmark'):
        lms = hand_landmarks.landmark
    else:
        lms = hand_landmarks
        
    drawing_utils.draw_landmarks(
        image,
        lms,
        HandLandmarksConnections.HAND_CONNECTIONS
    )
