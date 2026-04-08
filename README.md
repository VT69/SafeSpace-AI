# SafeSpace AI – Context-Aware Safety Assistant

A full-stack personal safety application with real-time risk scoring, safe route planning, and instant SOS alerts.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React + Vite + Tailwind CSS v4          |
| Backend  | FastAPI (Python 3.11+)                  |
| ML       | Scikit-learn (Random Forest)            |
| Maps     | Google Maps JavaScript API              |
| Geocode  | OpenStreetMap Nominatim (no key needed) |

---

## Quick Start

### 1. Backend Setup

```powershell
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the ML model (first time only)
python ml/train.py

# Copy env and add your Google Maps API key (optional)
copy .env.example .env

# Start the API server
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```powershell
cd frontend

# (Optional) Add your Google Maps API key
# Edit .env and set: VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Install dependencies (already done if you followed setup)
npm install

# Start the dev server
npm run dev
```

App available at: **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint       | Description                     |
|--------|---------------|---------------------------------|
| POST   | `/risk-score` | Get risk score for a location   |
| POST   | `/safe-route` | Get risk-weighted safe route    |
| POST   | `/sos`        | Trigger emergency SOS alert     |
| GET    | `/health`     | Health check                    |
| GET    | `/docs`       | Swagger API docs                |

### Risk Score Request
```json
POST /risk-score
{
  "lat": 12.9716,
  "lon": 77.5946,
  "hour": 22,
  "crowd_density": 0.3,
  "crime_score": 0.6
}
```

### Safe Route Request
```json
POST /safe-route
{
  "origin":      { "lat": 12.9716, "lon": 77.5946 },
  "destination": { "lat": 12.9352, "lon": 77.6146 }
}
```

---

## Risk Score Formula

```
risk = 0.35 * location_risk
     + 0.30 * time_risk
     + 0.35 * (1 - crowd_density)
     + 0.10 * crime_score
```

Route cost function:
```
cost = distance + λ * risk    (λ = 0.6)
```

---

## Project Structure

```
SafeSpace AI/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── routers/
│   │   ├── risk.py      # /risk-score
│   │   ├── route.py     # /safe-route
│   │   └── sos.py       # /sos
│   ├── ml/
│   │   ├── train.py     # Synthetic data + training
│   │   ├── model.py     # Predict + explain
│   │   └── risk_model.pkl
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/safeSpaceApi.js
        ├── hooks/
        │   ├── useLocation.js
        │   └── useRiskScore.js
        └── components/
            ├── Navbar.jsx
            ├── MapView.jsx
            ├── RiskPanel.jsx
            ├── SOSButton.jsx
            └── RoutePanel.jsx
```

---

## Adding Google Maps

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: **Maps JavaScript API** + **Directions API**
3. Add to `frontend/.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
4. Add to `backend/.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

The app works **without a Maps key** – it shows location coords and risk data, just without the visual map.

---

## Adding Real SOS Notifications

In `backend/routers/sos.py`, uncomment and configure the Twilio/SendGrid hooks:

```python
from services.twilio import send_sms
await send_sms(to=EMERGENCY_PHONE, body=f"SOS: {maps_url}")
```
