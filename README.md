# IntentFlow

> **AI interprets. Code decides. Airwallex enforces.**

IntentFlow is an intent-bound autonomous purchase agent for Track 2 of the Agentic Banking Hackathon. It converts a natural-language purchase request into a deterministic financial decision and then into bounded payment authority.

## Core loop

Intent → Policy → Authority → Observe → Re-evaluate

The model interprets intent and unstructured terms. Deterministic code calculates cash impact and policy violations. Airwallex provides the enforceable payment boundary.

## Repository

- `frontend/` — command center UI
- `backend/` — API, finance engine, policy engine, Airwallex adapter
- `database/` — MySQL schema
- `.env.example` — configuration template

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

Never commit `.env` or an Airwallex secret.
