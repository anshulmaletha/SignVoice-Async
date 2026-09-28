import MODEL_DATA from './customModelData.js';

/**
 * Normalizes 21 hand landmarks (x, y, z) to be translation-invariant (wrist origin)
 * and scale-invariant (max Euclidean distance magnitude).
 * 
 * Exactly reproduces Python training/utils.py normalize_landmarks logic.
 * 
 * @param {Array<{x: number, y: number, z: number}>} landmarks - 21 landmark objects from MediaPipe JS.
 * @returns {Float32Array|null} Flat array of 63 normalized coordinates or null if invalid.
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    return null;
  }

  const wristX = 1 - landmarks[0].x;
  const wristY = landmarks[0].y;
  const wristZ = landmarks[0].z;

  const relative = new Float32Array(63);
  let maxDist = 0;

  for (let i = 0; i < 21; i++) {
    const lx = 1 - landmarks[i].x;
    const ly = landmarks[i].y;
    const lz = landmarks[i].z;

    const rx = lx - wristX;
    const ry = ly - wristY;
    const rz = lz - wristZ;

    relative[i * 3] = rx;
    relative[i * 3 + 1] = ry;
    relative[i * 3 + 2] = rz;

    const dist = Math.sqrt(rx * rx + ry * ry + rz * rz);
    if (dist > maxDist) {
      maxDist = dist;
    }
  }

  const features = new Float32Array(63);
  if (maxDist > 0) {
    for (let i = 0; i < 63; i++) {
      features[i] = relative[i] / maxDist;
    }
  } else {
    for (let i = 0; i < 63; i++) {
      features[i] = relative[i];
    }
  }

  return features;
}

/**
 * Traverses a single decision tree node given normalized landmark features.
 */
function predictSingleTree(tree, features) {
  let node = 0;
  while (tree.children_left[node] !== -1) {
    const featureIdx = tree.feature[node];
    const threshold = tree.threshold[node];
    if (features[featureIdx] <= threshold) {
      node = tree.children_left[node];
    } else {
      node = tree.children_right[node];
    }
  }
  return tree.value[node];
}

/**
 * Predicts custom gesture class and confidence probability from MediaPipe hand landmarks.
 */
export function predictCustomGesture(landmarks, confidenceThreshold = 0.60) {
  const features = normalizeLandmarks(landmarks);
  if (!features) {
    return { categoryName: 'None', confidence: 0 };
  }

  const numClasses = MODEL_DATA.classes.length;
  const votes = new Float64Array(numClasses);
  let totalVotes = 0;

  for (let i = 0; i < MODEL_DATA.trees.length; i++) {
    const tree = MODEL_DATA.trees[i];
    const leafValue = predictSingleTree(tree, features);
    for (let c = 0; c < numClasses; c++) {
      votes[c] += leafValue[c];
      totalVotes += leafValue[c];
    }
  }

  if (totalVotes === 0) {
    return { categoryName: 'UNKNOWN', confidence: 0 };
  }

  let maxVotes = 0;
  let maxIdx = -1;
  for (let c = 0; c < numClasses; c++) {
    if (votes[c] > maxVotes) {
      maxVotes = votes[c];
      maxIdx = c;
    }
  }

  const confidence = maxVotes / totalVotes;

  if (maxIdx >= 0 && confidence >= confidenceThreshold) {
    return {
      categoryName: MODEL_DATA.classes[maxIdx],
      confidence: confidence
    };
  }

  return {
    categoryName: 'UNKNOWN',
    confidence: confidence
  };
}

/**
 * Diagnostic helper to extract top 3 custom gesture predictions and probabilities.
 */
export function predictTop3Custom(landmarks) {
  const features = normalizeLandmarks(landmarks);
  if (!features) return [];

  const numClasses = MODEL_DATA.classes.length;
  const votes = new Float64Array(numClasses);
  let totalVotes = 0;

  for (let i = 0; i < MODEL_DATA.trees.length; i++) {
    const tree = MODEL_DATA.trees[i];
    const leafValue = predictSingleTree(tree, features);
    for (let c = 0; c < numClasses; c++) {
      votes[c] += leafValue[c];
      totalVotes += leafValue[c];
    }
  }

  if (totalVotes === 0) return [];

  const list = [];
  for (let c = 0; c < numClasses; c++) {
    list.push({ class: MODEL_DATA.classes[c], prob: votes[c] / totalVotes });
  }
  list.sort((a, b) => b.prob - a.prob);
  return list.slice(0, 3);
}

export default {
  normalizeLandmarks,
  predictCustomGesture,
  predictTop3Custom
};
