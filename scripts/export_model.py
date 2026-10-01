import os
import json
import joblib

def export_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "models", "gesture_model.pkl")
    labels_path = os.path.join(base_dir, "models", "labels.json")
    output_js_path = os.path.join(base_dir, "src", "gesture", "customModelData.js")

    if not os.path.exists(model_path) or not os.path.exists(labels_path):
        raise FileNotFoundError(f"Missing model or labels file: {model_path}, {labels_path}")

    print(f"[Export] Loading model from {model_path}...")
    classifier = joblib.load(model_path)
    
    with open(labels_path, "r", encoding="utf-8") as f:
        labels = json.load(f)

    trees = []
    for estimator in classifier.estimators_:
        tree = estimator.tree_
        values = tree.value
        if values.ndim == 3:
            values = values.squeeze(axis=1)
            
        trees.append({
            "children_left": tree.children_left.tolist(),
            "children_right": tree.children_right.tolist(),
            "feature": tree.feature.tolist(),
            "threshold": tree.threshold.tolist(),
            "value": values.tolist()
        })

    exported_data = {
        "classes": labels,
        "n_features": int(classifier.n_features_in_),
        "n_estimators": len(trees),
        "trees": trees
    }

    js_content = f"// Auto-generated custom RandomForest model weights and structure\nexport const MODEL_DATA = {json.dumps(exported_data, indent=2)};\nexport default MODEL_DATA;\n"

    os.makedirs(os.path.dirname(output_js_path), exist_ok=True)
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"[Export] Successfully exported model to {output_js_path} ({os.path.getsize(output_js_path)} bytes)")

if __name__ == "__main__":
    export_model()
