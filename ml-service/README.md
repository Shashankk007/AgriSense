# AgriSense ML Service

FastAPI service that powers AgriSense's AI features: crop disease and pest detection, satellite NDVI analysis, and a RAG chatbot with long-term memory.

> **Server-to-server only.** Every endpoint except `/` and `/health` requires an `X-Admin-Key` header equal to `ML_ADMIN_KEY`. The React app never calls this service directly; the Express backend authenticates the user, checks ownership, and forwards the call.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/`, `/health` | Health checks (public) |
| GET | `/ndvi/{farm_id}` | NDVI tile URL and mean NDVI for a stored farm polygon (Google Earth Engine, Sentinel-2) |
| POST | `/predict/disease` | Classify a leaf image by URL (EfficientNet-B0, 50 classes) |
| POST | `/predict/pest` | Detect pests in an image by URL (YOLO); `422` when nothing is detected |
| POST | `/chat` | RAG chat answer with conversation continuity |
| GET | `/chat/history/{user_id}` | A user's conversations, newest first |
| GET | `/chat/conversation/{id}?user_id=` | Messages of a conversation, only if it belongs to `user_id` |
| POST | `/knowledge/upload` | Add documents to the knowledge base |
| POST/GET | `/memory/store`, `/memory/{user_id}` | Write or read a user's long-term memories |

Interactive docs are served at `/docs` when the service is running.

## Structure

```
app.py                  FastAPI app, middleware, routes
gee/                    Google Earth Engine initialisation (local or service account)
services/
  ndvi_service.py       Farm polygon → Sentinel-2 NDVI composite
  prediction_service.py Disease (PyTorch) and pest (YOLO) inference, image URL allow-list
chatbot/
  chains/               LLM chain: Groq (optional) → Gemini → fallback Gemini model
  retrievers/           Knowledge and memory retrieval
  vectorstore/          MongoDB Atlas Vector Search wrapper
  memory/               Conversation history, chat metadata, long-term memory
  agents/               Extracts durable facts about the farmer from messages
  loaders/, services/, prompts/, models/, config/, utils/
data/                   Disease and pest metadata (severity, cause, prevention, treatment)
disease_model.pt        Trained disease classifier weights
pest_model.pt           Trained pest detector weights
Agrisense.ipynb         Training notebook for the disease model
scripts/                Dev helpers: cli_chat.py, check_models.py, smoke_test_api.py
```

## Setup

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in the values
uvicorn app:app --port 8000
```

Key environment variables (see [.env.example](.env.example) for all of them):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI`, `DATABASE_NAME` | MongoDB connection and the chatbot database |
| `GOOGLE_API_KEY`, `LLM_MODEL` | Gemini chat model |
| `GROQ_API_KEY` (optional) | Faster primary chat model and memory extraction |
| `ML_ADMIN_KEY` | Shared secret; must match the Express backend |
| `GEE_INIT_MODE` and `GEE_*` | Earth Engine auth (`local` or `service_account`) |
| `ALLOWED_IMAGE_HOSTS` | Hosts the prediction endpoints may download images from |

### Atlas vector indexes (required for chat retrieval)

Embeddings are computed locally with FastEmbed (`BAAI/bge-small-en-v1.5`, **384 dimensions**, cosine). Create two Atlas Vector Search indexes on the database named in `DATABASE_NAME`:

| Collection | Index name | Vector path | Filter fields |
| --- | --- | --- | --- |
| `knowledge_base` | `knowledge_vector_index` | `embedding` | `category` |
| `user_memories` | `memory_vector_index` | `embedding` | `user_id` |

### Earth Engine

NDVI needs an authenticated Earth Engine account. Use `GEE_INIT_MODE=local` after running `earthengine authenticate`, or `service_account` with a key file or JSON. Never commit the key file.

## Try it from the terminal

```bash
python scripts/cli_chat.py          # interactive chat
python scripts/smoke_test_api.py    # calls the main endpoints on a running server
```
