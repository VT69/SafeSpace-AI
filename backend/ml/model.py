"""
SafeSpace AI – ML Model Wrapper
Loads the trained Random Forest and provides predict_risk().
"""

import os
import math
import joblib
import numpy as np
from typing import TypedDict

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")

LABELS = {0: "Safe", 1: "Moderate", 2: "High Risk"}
COLORS = {0: "#22c55e", 1: "#f59e0b", 2: "#ef4444"}
FEATURE_NAMES = ["hour", "lat", "lon", "crowd_density", "crime_score"]

SAFE_LAT, SAFE_LON = 12.9716, 77.5946


class RiskResult(TypedDict):
    score: float          # 0–100
    level: str            # Safe / Moderate / High Risk
    color: str            # hex color
    probability: list[float]
    explanation: list[dict]


def _load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Run `python ml/train.py` first."
        )
    return joblib.load(MODEL_PATH)


_model = None


def get_model():
    global _model
    if _model is None:
        _model = _load_model()
    return _model


def _location_risk(lat: float, lon: float) -> float:
    dist = math.sqrt((lat - SAFE_LAT) ** 2 + (lon - SAFE_LON) ** 2)
    return min(dist / 0.15, 1.0)


def _time_risk(hour: int) -> float:
    if hour >= 22 or hour <= 5:
        return 0.9
    if hour >= 18 or hour <= 8:
        return 0.55
    return 0.2


def _build_explanation(
    hour: int,
    lat: float,
    lon: float,
    crowd_density: float,
    crime_score: float,
    importances: np.ndarray,
) -> list[dict]:
    """Build human-readable explanation using feature importances."""
    values = {
        "hour": _time_risk(hour),
        "lat": _location_risk(lat, lon),
        "lon": _location_risk(lat, lon),
        "crowd_density": 1 - crowd_density,
        "crime_score": crime_score,
    }
    labels_map = {
        "hour": f"Time of day ({hour}:00)",
        "lat": "Location risk (proximity to high-risk zones)",
        "lon": "Location risk (proximity to high-risk zones)",
        "crowd_density": f"Low crowd density ({crowd_density:.0%})",
        "crime_score": f"Area crime index ({crime_score:.0%})",
    }
    seen = set()
    result = []
    for feat, imp in zip(FEATURE_NAMES, importances):
        label = labels_map[feat]
        if label in seen:
            continue
        seen.add(label)
        val = values[feat]
        severity = "high" if val > 0.6 else "medium" if val > 0.3 else "low"
        result.append({
            "factor": label,
            "importance": round(float(imp) * 100, 1),
            "value": round(float(val), 3),
            "severity": severity,
        })
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result[:4]


def predict_risk(
    hour: int,
    lat: float,
    lon: float,
    crowd_density: float = 0.5,
    crime_score: float = 0.3,
) -> RiskResult:
    model = get_model()
    X = np.array([[hour, lat, lon, crowd_density, crime_score]])
    proba = model.predict_proba(X)[0]
    label_idx = int(np.argmax(proba))

    # Weighted score 0–100 (Safe=0, Moderate=50, High=100)
    score = round(float(proba[1] * 50 + proba[2] * 100), 1)

    importances = model.feature_importances_
    explanation = _build_explanation(
        hour, lat, lon, crowd_density, crime_score, importances
    )

    return RiskResult(
        score=score,
        level=LABELS[label_idx],
        color=COLORS[label_idx],
        probability=[round(float(p), 3) for p in proba],
        explanation=explanation,
    )
