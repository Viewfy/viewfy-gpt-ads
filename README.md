# Viewfy 💙 GPT Ads

Standalone app: one business domain becomes a researched ChatGPT Ads campaign.

Astra builds an editable mind map first. Ads are not fetched until **Confirm business map & research ads**. Then Meta Ad Library + Google Ads Transparency, three concepts, one GPT Image 2 `chat_card`, and launch (or a labeled demo export).

## Run

```bash
cp .env.example .env   # add keys
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# terminal 1 — no --reload; restart after Python changes
cd backend && uvicorn app:app --port 9410 --host 127.0.0.1

# terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173

`MOCK=1` is the default. Every step uses `fixtures/superagent/run.json` (map, ads, insights, concepts, creative). No crawl, Apify, OpenAI, or Ads API. Set `MOCK=0` for live calls.

Pitch path: paste `getsuperagent.com`.

## Env

| Key | Used for |
| --- | --- |
| `OPENAI_API_KEY` | Brief, insights, concepts, GPT Image 2 |
| `OPENAI_ADS_API_KEY` | `GET /ad_account` and launch. Missing key = Demo / export |
| `APIFY_TOKEN` | Meta Ad Library + Google Ads Transparency |

Keys stay on the server. Launch is the only spend action.

## Steps

Understanding → Confirmation → Research → Concepts → Creatives → Launch

Copied from Viewfy: cream first screen, star mascot, dark radial map language (`frontend/public/demo/`), Meta scraper (`backend/meta_library.py`).

## Hackathon cut

One domain, two competitors, three concepts, one creative set, one campaign. Chat card limits: title 3–50, body 100.
