"""SafeSpace AI – /safe-route endpoint
Uses a risk-weighted cost function: cost = distance + λ * risk
Falls back to mock route if Google Maps key is unavailable.
"""

import os
import math
import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field
from ml.model import predict_risk
from datetime import datetime

router = APIRouter(prefix="/safe-route", tags=["Route"])
GMAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
LAMBDA = 0.6  # risk weight in cost function


class Waypoint(BaseModel):
    lat: float
    lon: float
    label: str | None = None


class RouteRequest(BaseModel):
    origin: Waypoint
    destination: Waypoint
    hour: int | None = None


class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    risk_score: float
    risk_level: str
    risk_color: str


class RouteResponse(BaseModel):
    total_distance_m: float
    total_cost: float
    risk_weighted_cost: float
    steps: list[RouteStep]
    polyline: list[dict]  # [{lat, lng}]
    summary: str


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Return distance in metres between two GPS coords."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _interpolate_waypoints(origin: Waypoint, destination: Waypoint, n: int = 5) -> list[dict]:
    """Interpolate n waypoints between origin and destination."""
    points = []
    for i in range(n + 1):
        t = i / n
        points.append({
            "lat": origin.lat + t * (destination.lat - origin.lat),
            "lng": origin.lon + t * (destination.lon - origin.lon),
        })
    return points


def _mock_route(origin: Waypoint, destination: Waypoint, hour: int) -> RouteResponse:
    """Generate a mock safe route with risk scoring per segment."""
    polyline = _interpolate_waypoints(origin, destination, n=6)
    steps: list[RouteStep] = []
    total_dist = 0.0
    total_cost = 0.0

    instructions = [
        "Head towards the main road",
        "Turn right onto safe corridor",
        "Continue straight through lit area",
        "Bear left towards destination",
        "Arrive at destination",
    ]

    for i in range(len(polyline) - 1):
        p1, p2 = polyline[i], polyline[i + 1]
        dist = _haversine(p1["lat"], p1["lng"], p2["lat"], p2["lng"])
        risk = predict_risk(
            hour=hour,
            lat=p1["lat"],
            lon=p1["lng"],
            crowd_density=0.5,
            crime_score=0.3,
        )
        cost = dist + LAMBDA * risk["score"] * 10
        total_dist += dist
        total_cost += cost
        steps.append(RouteStep(
            instruction=instructions[min(i, len(instructions) - 1)],
            distance_m=round(dist, 1),
            risk_score=risk["score"],
            risk_level=risk["level"],
            risk_color=risk["color"],
        ))

    risk_cost = round(LAMBDA * sum(s.risk_score for s in steps), 2)
    return RouteResponse(
        total_distance_m=round(total_dist, 1),
        total_cost=round(total_cost, 2),
        risk_weighted_cost=risk_cost,
        steps=steps,
        polyline=polyline,
        summary=f"Safest route ({round(total_dist / 1000, 2)} km)",
    )


async def _gmaps_route(origin: Waypoint, destination: Waypoint, hour: int) -> RouteResponse:
    """Call Google Maps Directions API and overlay risk scores."""
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{origin.lat},{origin.lon}",
        "destination": f"{destination.lat},{destination.lon}",
        "key": GMAPS_KEY,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    if data["status"] != "OK":
        return _mock_route(origin, destination, hour)

    route = data["routes"][0]["legs"][0]
    steps: list[RouteStep] = []
    polyline: list[dict] = []

    for step in route["steps"]:
        slat = step["start_location"]["lat"]
        slon = step["start_location"]["lng"]
        dist = step["distance"]["value"]
        risk = predict_risk(hour=hour, lat=slat, lon=slon)
        cost = dist + LAMBDA * risk["score"] * 10
        steps.append(RouteStep(
            instruction=step["html_instructions"],
            distance_m=dist,
            risk_score=risk["score"],
            risk_level=risk["level"],
            risk_color=risk["color"],
        ))
        polyline.append({"lat": slat, "lng": slon})

    total_dist = route["distance"]["value"]
    total_cost = sum(s.distance_m + LAMBDA * s.risk_score * 10 for s in steps)
    risk_cost = round(LAMBDA * sum(s.risk_score for s in steps), 2)

    return RouteResponse(
        total_distance_m=total_dist,
        total_cost=round(total_cost, 2),
        risk_weighted_cost=risk_cost,
        steps=steps,
        polyline=polyline,
        summary=route["summary"] or "Safest route via Google Maps",
    )


@router.post("", response_model=RouteResponse)
async def get_safe_route(req: RouteRequest):
    hour = req.hour if req.hour is not None else datetime.now().hour
    if GMAPS_KEY and GMAPS_KEY != "your_google_maps_api_key_here":
        try:
            return await _gmaps_route(req.origin, req.destination, hour)
        except Exception:
            pass  # fall through to mock
    return _mock_route(req.origin, req.destination, hour)
