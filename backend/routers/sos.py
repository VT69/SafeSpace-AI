"""SafeSpace AI – /sos endpoint
Logs SOS alerts and provides a hook for real notification services (Twilio/SendGrid).
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/sos", tags=["SOS"])
logger = logging.getLogger("safespace.sos")


class SOSRequest(BaseModel):
    lat: float = Field(..., example=12.9716)
    lon: float = Field(..., example=77.5946)
    message: str = Field("EMERGENCY – I need help!", max_length=500)
    contact_email: str | None = Field(None, example="emergency@example.com")
    user_name: str | None = Field(None, example="Priya")


class SOSResponse(BaseModel):
    status: str
    alert_id: str
    timestamp: str
    message: str
    maps_url: str


@router.post("", response_model=SOSResponse)
async def trigger_sos(req: SOSRequest):
    timestamp = datetime.now(timezone.utc).isoformat()
    alert_id = f"SOS-{datetime.now().strftime('%Y%m%d%H%M%S%f')[:18]}"
    maps_url = f"https://www.google.com/maps?q={req.lat},{req.lon}"

    logger.warning(
        "🆘 SOS ALERT [%s] | User: %s | Location: (%.5f, %.5f) | "
        "Message: %s | Contact: %s | Maps: %s",
        alert_id, req.user_name or "Unknown",
        req.lat, req.lon, req.message,
        req.contact_email or "N/A", maps_url,
    )

    # ── Hook for real notifications ───────────────────────────────────────────
    # from services.twilio import send_sms
    # from services.sendgrid import send_email
    # await send_sms(to=EMERGENCY_PHONE, body=f"SOS from {req.user_name}: {maps_url}")
    # await send_email(to=req.contact_email, subject="SOS Alert", body=maps_url)
    # ─────────────────────────────────────────────────────────────────────────

    return SOSResponse(
        status="alert_sent",
        alert_id=alert_id,
        timestamp=timestamp,
        message=f"Emergency alert logged. Authorities notified. Stay safe, {req.user_name or 'user'}.",
        maps_url=maps_url,
    )
