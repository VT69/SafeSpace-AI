"""SafeSpace AI – /risk-score endpoint"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime
from ml.model import predict_risk

router = APIRouter(prefix="/risk-score", tags=["Risk"])


class RiskRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, example=12.9716)
    lon: float = Field(..., ge=-180, le=180, example=77.5946)
    hour: int | None = Field(None, ge=0, le=23, description="Hour of day (0–23). Defaults to current hour.")
    crowd_density: float = Field(0.5, ge=0.0, le=1.0, example=0.4)
    crime_score: float = Field(0.3, ge=0.0, le=1.0, example=0.3)


class RiskResponse(BaseModel):
    score: float
    level: str
    color: str
    probability: list[float]
    explanation: list[dict]


@router.post("", response_model=RiskResponse)
async def get_risk_score(req: RiskRequest):
    hour = req.hour if req.hour is not None else datetime.now().hour
    result = predict_risk(
        hour=hour,
        lat=req.lat,
        lon=req.lon,
        crowd_density=req.crowd_density,
        crime_score=req.crime_score,
    )
    return result
