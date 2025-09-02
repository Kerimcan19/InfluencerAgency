# app/mlink/client.py
from datetime import datetime, timedelta, timezone
import httpx
import os
from dotenv import load_dotenv
from dateutil.parser import isoparse

load_dotenv()  # Load .env file once here

MLINK_BASE = "https://api.mlink.com.tr"
MLINK_USERNAME = os.getenv("MLINK_USERNAME")
MLINK_PASSWORD = os.getenv("MLINK_PASSWORD")

class MLinkClient:
    def __init__(self):
        self._token = None
        self._expires_at = None

    async def _ensure_token(self):
        if self._token and self._expires_at and self._expires_at > datetime.now(timezone.utc):
            return  # Token is still valid

        async with httpx.AsyncClient(timeout=30) as s:
            r = await s.post(f"{MLINK_BASE}/Account/GetTokenV2", json={
                "username": MLINK_USERNAME,
                "password": MLINK_PASSWORD
            })
            r.raise_for_status()
            data = r.json()
            if not data.get("isSuccess"):
                raise RuntimeError(f"MLink login failed: {data.get('message')}")
            self._token = data["data"]["accessToken"]
            exp_str = data["data"]["expiration"]
            self._expires_at = isoparse(exp_str) - timedelta(seconds=60)

    async def _headers(self):
        await self._ensure_token()
        return {"Authorization": f"Bearer {self._token}"}

    async def get_campaigns(self, params=None):
        async with httpx.AsyncClient(timeout=30, headers=await self._headers()) as s:
            r = await s.get(f"{MLINK_BASE}/Affiliate/GetCampaigns", params=params or {})
            r.raise_for_status()
            return r.json()

    async def get_report(self, params=None):
        async with httpx.AsyncClient(timeout=30, headers=await self._headers()) as s:
            r = await s.get(f"{MLINK_BASE}/Affiliate/GetReport", params=params or {})
            r.raise_for_status()
            return r.json() 

    async def generate_link(self, body):
        async with httpx.AsyncClient(timeout=30, headers=await self._headers()) as s:
            r = await s.put(f"{MLINK_BASE}/Affiliate/GenerateLink", json=body)
            r.raise_for_status()
            return r.json()

mlink_client = MLinkClient()
