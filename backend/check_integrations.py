"""Day-one checks: Ads account, Meta token, Google actor reachability."""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from config import APIFY_TOKEN, OPENAI_ADS_API_KEY
from openai_ads import ad_account


async def main() -> None:
    acct = await ad_account()
    print("openai_ads", "ok" if acct.get("ok") else "demo", acct.get("name") or acct.get("error"))
    print("apify", "set" if APIFY_TOKEN else "missing")
    print("ads_key", "set" if OPENAI_ADS_API_KEY else "missing")


if __name__ == "__main__":
    asyncio.run(main())
