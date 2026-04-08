"""
SafeSpace AI – FastAPI Application Entry Point
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import risk, route, sos
from ml.model import get_model

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("safespace")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 SafeSpace AI starting up – loading ML model...")
    try:
        get_model()
        logger.info("✅ Risk model loaded successfully.")
    except FileNotFoundError as e:
        logger.error("❌ %s", e)
        logger.error("   Run: python ml/train.py   to generate the model first.")
    yield
    logger.info("🛑 SafeSpace AI shutting down.")


app = FastAPI(
    title="SafeSpace AI",
    description="Context-Aware Safety Assistant API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk.router)
app.include_router(route.router)
app.include_router(sos.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": "SafeSpace AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
