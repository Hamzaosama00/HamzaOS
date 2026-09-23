# HAMZA OS — Production Edition

Private personal self-improvement dashboard for Hamza: daily routine checklist, mood/energy check-ins, progress history, AI coach, and Ollama Cloud integration.

## What changed from starter

- FastAPI backend instead of the localhost-only Python HTTP server
- First-run admin password setup and session login
- Encrypted local Ollama API key vault
- Trusted host protection through `ALLOWED_HOSTS`
- Security headers and private API responses
- Rate limits for login, chat, key save, and replanning
- SQLite WAL database with persistent Docker volume
- Health check endpoint: `/healthz`
- Data export endpoint: `/api/export`
- Dockerfile + Docker Compose
- Backup and password reset scripts
- Automated backend tests

## Quick local run

```powershell
# Recommended: use a virtual environment so other Python apps do not conflict
py -m venv .venv
.\.venv\Scripts\activate

py -m pip install --upgrade pip
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

First time, the dashboard will ask you to create an admin password. After login, open **AI Settings** and save your new Ollama key.

## Docker run

```bash
cp .env.example .env
# Edit .env before public deployment
# APP_SECRET_KEY must be changed
# ALLOWED_HOSTS should include your domain

docker compose up --build -d
```

Open:

```text
http://127.0.0.1:8000
```

## Production deployment checklist

1. Generate a strong `APP_SECRET_KEY` in `.env`.
2. Set `ALLOWED_HOSTS` to your real domain, for example `hamza.example.com`.
3. Put the app behind HTTPS using Cloudflare Tunnel, Caddy, Nginx, or your hosting platform.
4. Set `COOKIE_SECURE=1` when the app is served over HTTPS.
5. Mount/preserve the `data/` folder. It contains the database, session secret, and encrypted key vault.
6. Do not commit `.env`, `data/`, `*.key`, `*.enc`, or `*.sqlite3` files.
7. Revoke any Ollama API key that was pasted into chat or shared anywhere, then generate a fresh one and save it in the dashboard.

## Ollama settings

Default free-credit-friendly cloud model:

```env
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_MODEL=gpt-oss:20b-cloud
```

Why this default: `gpt-oss:20b-cloud` is a Low Usage cloud tag, while `gpt-oss:120b-cloud` is Medium Usage. The 20B model is a better first production default for daily routines, chat, and checklist planning. You can switch later by editing `OLLAMA_MODEL` in `.env`.

Other free-credit cloud choices you mentioned:

```env
# OLLAMA_MODEL=gemma4:31b-cloud
# OLLAMA_MODEL=gpt-oss:120b-cloud
# OLLAMA_MODEL=nemotron-3-nano:30b-cloud
# OLLAMA_MODEL=nemotron-3-super-cloud
# OLLAMA_MODEL=nemotron-3-ultra-cloud
```

Local alternative:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1
```

For cloud mode, either save the API key in the web dashboard or set:

```env
OLLAMA_API_KEY=your_key_here
```

Dashboard-saved key takes priority over environment key. The browser never receives the saved key.

## Backup

```bash
python scripts/backup.py
```

Backups are created in the `backups/` folder.

## Reset admin password

```bash
python scripts/reset_password.py
```

Docker:

```bash
docker compose exec hamza-os python scripts/reset_password.py
```

## Run tests

```bash
pytest -q
```

## Important safety note

HAMZA OS is a habit and self-reflection tool. It is not medical advice, diagnosis, or a substitute for a doctor. For dizziness, fainting, pain, severe fatigue, or growth concerns, involve a trusted adult and healthcare professional.


## Fix included in this build

`itsdangerous==2.2.0` is included because Starlette `SessionMiddleware` needs it for signed browser sessions. Without it, Windows shows `ModuleNotFoundError: No module named 'itsdangerous'` when starting Uvicorn.
