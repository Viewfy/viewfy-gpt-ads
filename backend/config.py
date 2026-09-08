from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_ADS_API_KEY = os.getenv("OPENAI_ADS_API_KEY", "").strip()
APIFY_TOKEN = os.getenv("APIFY_TOKEN", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-6-astra")
OPENAI_IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-2")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "9410"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
DATA_DIR = Path(os.getenv("DATA_DIR", ROOT / "backend" / "data"))
FIXTURE_DIR = ROOT / "fixtures" / "superagent"
STATIC_DIR = ROOT / "frontend" / "public"
MOCK = os.getenv("MOCK", "0").strip().lower() in {"1", "true", "yes", "on"}
LIVE_CAMPAIGN_SUBMISSION_ENABLED = os.getenv("LIVE_CAMPAIGN_SUBMISSION_ENABLED", "0").strip().lower() in {"1", "true", "yes", "on"}
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:5173/api/github/callback").strip()
CURSOR_API_KEY = os.getenv("CURSOR_API_KEY", "").strip()
PIXEL_PUBLIC_URL = os.getenv("PIXEL_PUBLIC_URL", "http://127.0.0.1:9410").rstrip("/")
DATA_DIR.mkdir(parents=True, exist_ok=True)
