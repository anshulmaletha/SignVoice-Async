import os
import sys
import json
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

def train():
    dataset_dir = os.path.abspath("dataset")
    models_dir = os.path.abspath("models")
    os.makedirs(models_dir, exist_ok=True)

    if not os.path.exists(dataset_dir):
        print(f"Error: Dataset directory '{dataset_dir}' does not exist.")
        sys.exit(1)

    X = []
    y = []

    # Get gesture subdirectories sorted alphabetically
    gesture_folders = sorted([
        d for d in os.listdir(dataset_dir)
        if os.path.isdir(os.path.join(dataset_dir, d))
    ])

    if not gesture_folders:
        print(f"Error: No gesture folders found in '{dataset_dir}'. Please collect data first using collect_data.py.")
        sys.exit(1)

    print("\n==========================================")
    print("  SignVoice Gesture Model Trainer")
    print("==========================================")
    print(f"Dataset location: {dataset_dir}")
    print("Loading gesture landmark samples...")

    labels = []
    class_counts = {}

    for folder_name in gesture_folders:
        folder_path = os.path.join(dataset_dir, folder_name)
        npy_files = [f for f in os.listdir(folder_path) if f.endswith(".npy")]
        
        if not npy_files:
            continue
            
        labels.append(folder_name)
        count = 0
        for npy_file in npy_files:
            file_path = os.path.join(folder_path, npy_file)
            try:
                data = np.load(file_path)
                if data.shape == (63,):
                    X.append(data)
                    y.append(folder_name)
                    count += 1
            except Exception as e:
                print(f"Warning: Failed to load {file_path}: {e}")
                
        class_counts[folder_name] = count

    if not X:
        print("Error: No valid landmark samples found in dataset directory!")
        sys.exit(1)

    X = np.array(X)
    y = np.array(y)

    print(f"\nTotal loaded samples: {len(X)}")
    print("Samples per gesture:")
    for label_name, cnt in class_counts.items():
        print(f"  - {label_name}: {cnt} samples")

    if len(labels) < 2:
        print("\nWarning: Need at least 2 distinct gesture classes to train a classifier.")
        print("Model training requires data for multiple gestures.")

    # Train/Test Split
    min_samples = min(class_counts.values()) if class_counts else 0
    can_stratify = min_samples >= 2

    if len(X) >= 5 and can_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        # Fallback split if dataset is very small
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

    print("\nTraining RandomForestClassifier model...")
    classifier = RandomForestClassifier(n_estimators=100, random_state=42)
    classifier.fit(X_train, y_train)

    # Evaluation
    y_pred = classifier.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    
    print("\n==========================================")
    print(f"  Overall Test Accuracy: {acc * 100:.2f}%")
    print("==========================================")
    print("\nPer-Gesture Classification Report:")
    report = classification_report(y_test, y_pred, zero_division=0)
    print(report)

    # Re-train on full dataset for maximum deployment accuracy
    classifier.fit(X, y)

    # Save Model & Labels
    model_path = os.path.join(models_dir, "gesture_model.pkl")
    labels_path = os.path.join(models_dir, "labels.json")

    joblib.dump(classifier, model_path)
    
    unique_labels = sorted(list(set(y)))
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(unique_labels, f, indent=2)

    print("\n==========================================")
    print("  Artifacts Saved Successfully:")
    print(f"  1. Model File:  {model_path}")
    print(f"  2. Labels File: {labels_path}")
    print("==========================================\n")

if __name__ == "__main__":
    train()
