"""
SafeSpace AI – ML Training Script
Generates synthetic safety data and trains a Random Forest risk model.
Run once before starting the server: python ml/train.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

RANDOM_SEED = 42
N_SAMPLES = 8000
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")


def simulate_location_risk(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """
    Simulate location-based risk using distance from 'safe zones'.
    Safe zone center: (12.9716, 77.5946) – Bangalore center (example).
    """
    safe_lat, safe_lon = 12.9716, 77.5946
    dist = np.sqrt((lat - safe_lat) ** 2 + (lon - safe_lon) ** 2)
    # Normalize 0–1, farther = higher risk
    return np.clip(dist / 0.15, 0, 1)


def simulate_time_risk(hour: np.ndarray) -> np.ndarray:
    """
    Night hours (22:00–05:00) are higher risk.
    """
    risk = np.where(
        (hour >= 22) | (hour <= 5), 0.9,
        np.where((hour >= 18) | (hour <= 8), 0.55, 0.2)
    )
    return risk.astype(float)


def generate_dataset(n: int) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    # Random coordinates around Bangalore
    lat = rng.uniform(12.85, 13.10, n)
    lon = rng.uniform(77.45, 77.75, n)
    hour = rng.integers(0, 24, n)
    crowd_density = rng.uniform(0, 1, n)
    crime_score = rng.uniform(0, 1, n)

    location_risk = simulate_location_risk(lat, lon)
    time_risk = simulate_time_risk(hour)

    # Weighted risk formula from project spec
    w1, w2, w3 = 0.35, 0.30, 0.35
    risk_score = (
        w1 * location_risk
        + w2 * time_risk
        + w3 * (1 - crowd_density)
        + 0.1 * crime_score
        + rng.normal(0, 0.05, n)  # noise
    )
    risk_score = np.clip(risk_score, 0, 1)

    # Labels: 0=Safe, 1=Moderate, 2=High Risk
    labels = np.where(risk_score < 0.35, 0, np.where(risk_score < 0.65, 1, 2))

    return pd.DataFrame({
        "hour": hour,
        "lat": lat,
        "lon": lon,
        "crowd_density": crowd_density,
        "crime_score": crime_score,
        "location_risk": location_risk,
        "time_risk": time_risk,
        "risk_score": risk_score,
        "label": labels,
    })


def train():
    print("🔧 Generating synthetic dataset...")
    df = generate_dataset(N_SAMPLES)

    features = ["hour", "lat", "lon", "crowd_density", "crime_score"]
    X = df[features]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    print("🤖 Training Random Forest...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    print("\n📊 Classification Report:")
    print(classification_report(y_test, model.predict(X_test),
                                target_names=["Safe", "Moderate", "High Risk"]))

    joblib.dump(model, MODEL_PATH)
    print(f"✅ Model saved to: {MODEL_PATH}")
    return model


if __name__ == "__main__":
    train()
