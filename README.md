# AgriSense

AI-powered smart farming platform. Farmers draw their fields on a map, scan crop photos for **diseases** and **pests**, watch **satellite crop health (NDVI)**, track farm **inventory**, and ask a **RAG-based agriculture chatbot** that remembers their farm context.

[![CI](https://github.com/Shashankk007/AgriSense/actions/workflows/ci.yml/badge.svg)](https://github.com/Shashankk007/AgriSense/actions/workflows/ci.yml)

## Features

| Area | What it does |
| --- | --- |
| **Farm mapping** | Draw a field boundary on a Leaflet map; the API stores it as GeoJSON and computes the area with Turf.js. |
| **Disease detection** | Upload up to 5 leaf photos; an EfficientNet-B0 classifier returns the disease (50 classes across PlantVillage and rice datasets) with severity, cause, prevention and treatment. |
| **Pest detection** | A YOLO model detects pests in a photo and returns pest details and control advice. |
| **Detection history** | Every scan is saved per user and linked to a farm; records can be reviewed and deleted. |
| **Crop health (NDVI)** | Sentinel-2 imagery is processed on Google Earth Engine for a farm polygon, returning an NDVI map layer and average value. |
| **AI chatbot** | LangChain RAG over an agriculture knowledge base in MongoDB Atlas Vector Search, with per-conversation history and long-term memory of facts about each farmer. Gemini is the primary LLM, with Groq and fallback models. |
| **Inventory** | Track seeds, fertilizers, pesticides and equipment per user. |
| **Auth** | Email/password and Google sign-in, JWT access and refresh tokens in HttpOnly cookies, and password reset by email. |

## Architecture

```
┌──────────────┐   /api (cookie auth)   ┌──────────────────┐   X-Admin-Key    ┌──────────────────────┐
│  React SPA   │ ─────────────────────▶ │  Express API     │ ───────────────▶ │  FastAPI ML service  │
│  (client/)   │                        │  (backend/)      │                  │  (ml-service/)       │
└──────────────┘                        └───────┬──────────┘                  └───────┬──────────────┘
                                                │                                     │
                                       MongoDB · Cloudinary                MongoDB Atlas Vector Search
                                                                           Google Earth Engine · PyTorch
```

The ML service is **server-to-server only**. The browser never calls it: the Express backend authenticates the user, checks ownership (for example that a farm belongs to the caller), and forwards the request with a shared secret (`ML_ADMIN_KEY`). Chat `user_id` always comes from the verified session, never from the request body.

## Tech stack

- **Client:** React 19, Vite, Tailwind CSS 4, React Router, Leaflet / leaflet-draw, Axios
- **Backend:** Node.js, Express 5, Mongoose, JWT, Helmet, Multer, Cloudinary, Nodemailer, Turf.js
- **ML service:** Python, FastAPI, PyTorch / torchvision, Ultralytics YOLO, LangChain, FastEmbed, Google Earth Engine
- **Data:** MongoDB (Atlas Vector Search for RAG)

## Repository layout

```
client/       React single-page app             → client/README.md
backend/      Express REST API                  → backend/README.md
ml-service/   FastAPI ML, chatbot and NDVI      → ml-service/README.md
.github/      CI workflow (lint, build, tests)
```

## Getting started

**Prerequisites:** Node.js 22 (used in CI), Python 3, a MongoDB database (local or Atlas), a Cloudinary account, a Google OAuth client ID, and a Gemini API key. NDVI additionally needs a Google Earth Engine account.

1. **Configure environment files.** Copy each `.env.example` to `.env` and fill it in:
   `backend/.env.example`, `ml-service/.env.example`, `client/.env.example`.
   Set the same `ML_ADMIN_KEY` in `backend/.env` and `ml-service/.env`. Never commit `.env` files.
2. **ML service** (port 8000):
   ```bash
   cd ml-service
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app:app --port 8000
   ```
3. **Backend** (port 5555):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
4. **Client** (port 5176):
   ```bash
   cd client
   npm install
   npm run dev
   ```

For the chatbot's retrieval, create the two Atlas vector indexes described in [ml-service/README.md](ml-service/README.md).

## Quality checks

```bash
cd backend && npm test          # unit tests (Node's built-in test runner)
cd client  && npm run lint && npm run build
```

The same checks run in GitHub Actions on every push and pull request.

## Security notes

- Secrets live only in gitignored `.env` files; the repository ships `.env.example` templates.
- All data routes require authentication and are scoped to the signed-in user.
- Uploads are filtered by file type, and the ML service only downloads images from an allow-listed host.

## Contributors

[@Shashankk007](https://github.com/Shashankk007), [@utkarsh-0410](https://github.com/utkarsh-0410), Tanish Mittal, [@VKantB05](https://github.com/VKantB05) and Aayush.

## License

[MIT](LICENSE)
