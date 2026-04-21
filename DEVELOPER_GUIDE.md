# Internal Developer Guide

This document is for engineers working **inside** the Fleet Violation Monitoring codebase. It assumes you have already read the top-level [`README.md`](./README.md) for product context, demo credentials, and high-level architecture.

> **Scope:** code layout, non-obvious behavior, extension playbooks, gotchas, and troubleshooting. Nothing in here should duplicate the README -- update both if a fact changes.

---

## Table of Contents

1. [Repository Map](#1-repository-map)
2. [Running Locally](#2-running-locally)
3. [Backend Deep Dive](#3-backend-deep-dive)
4. [Frontend Deep Dive](#4-frontend-deep-dive)
5. [Detection Pipelines](#5-detection-pipelines)
6. [WebRTC Signaling Protocol](#6-webrtc-signaling-protocol)
7. [Evidence Capture Pipeline](#7-evidence-capture-pipeline)
8. [Scoring Engine Internals](#8-scoring-engine-internals)
9. [Environment & Configuration](#9-environment--configuration)
10. [Extending the System](#10-extending-the-system)
11. [Testing & Demo Workflows](#11-testing--demo-workflows)
12. [Gotchas & Known Issues](#12-gotchas--known-issues)
13. [Troubleshooting](#13-troubleshooting)
14. [Release Checklist](#14-release-checklist)

---

## 1. Repository Map

```
Fleet_Violation_Monitoring/
|-- backend/                 FastAPI service + SQLite DB
|   |-- app/
|   |   |-- main.py          App factory, middleware, static mount, table bootstrap
|   |   |-- config.py        Settings (env vars, secret key, CORS)
|   |   |-- database.py      SQLAlchemy engine + SessionLocal + Base
|   |   |-- dependencies.py  Auth dependency (JWT -> User)
|   |   |-- core/
|   |   |   |-- security.py       JWT encode/decode + bcrypt helpers
|   |   |   `-- permissions.py    require_roles(*) decorator factory
|   |   |-- models/          SQLAlchemy ORM models (one table each)
|   |   |-- schemas/         Pydantic request/response models
|   |   |-- routers/         FastAPI routers (auth, violations, cameras, ...)
|   |   |-- services/        Business logic: scoring_engine, dashboard, reports
|   |   `-- <various>
|   |-- seed.py              Idempotent demo seeder
|   |-- simulate_camera.py   Webhook event simulator for load/demo
|   |-- uploads/             Runtime file storage (snapshots/, clips/)
|   |-- requirements.txt
|   `-- venv/                local virtualenv (not committed)
|
|-- frontend/                React 19 + Vite + Antd SPA
|   |-- src/
|   |   |-- pages/           Route-level components
|   |   |-- components/      Reusable UI (layout, common, charts)
|   |   |-- hooks/           Camera + WebRTC + permission hooks
|   |   |-- services/        Axios client + API functions
|   |   |-- context/         Auth context
|   |   |-- constants/       Shared enums (roles, event types, colors)
|   |   |-- utils/geo.js     GPS + OSM helpers for stop-sign fusion
|   |   `-- routes/          Route table
|   |-- public/
|   |   `-- siren.mp3        Stop-sign siren audio
|   |-- vite.config.js       Dev server, proxy rules
|   `-- package.json
|
|-- graphify-out/            Graphify skill output (safe to delete)
|-- README.md                Product/user docs
`-- DEVELOPER_GUIDE.md       <-- this file
```

**When in doubt:** `backend/app/main.py` and `frontend/src/pages/cameras/DriverCamera.jsx` are the two files with the widest blast radius. Start there when tracing a bug.

---

## 2. Running Locally

### First-time setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py                         # creates fleet_violations.db

# Frontend
cd ../frontend
npm install
```

### Day-to-day

Open two terminals:

```bash
# Terminal 1 -- backend (auto-reload)
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 -- frontend (proxies /api to :8000)
cd frontend && npm run dev
```

Then visit `http://localhost:5173`.

### Resetting state

```bash
cd backend
rm -rf fleet_violations.db uploads/snapshots/* uploads/clips/*
python seed.py
```

Uploads directories are recreated at app startup if missing (`main.py` ensures `uploads/snapshots` and `uploads/clips`).

### Generating traffic without a browser

```bash
cd backend && source venv/bin/activate
python simulate_camera.py --interval 2 --burst 3
```

---

## 3. Backend Deep Dive

### 3.1 Startup and middleware (`app/main.py`)

- Uses FastAPI's **lifespan context manager** to call `Base.metadata.create_all(bind=engine)` on startup. There are **no Alembic migrations** -- in dev, schema changes require deleting `fleet_violations.db` and re-seeding.
- **CORS**: origins come from `settings.CORS_ORIGINS` (comma-separated). Credentials, all methods, and all headers are allowed. Tighten this before any real deployment.
- Static mount: `/uploads/` serves `backend/uploads/` so the frontend can load snapshots and clips by URL.

### 3.2 Config (`app/config.py`)

All settings are read from env vars via Pydantic. Defaults are fine for local dev; **override `SECRET_KEY` and `WEBHOOK_API_KEY` in production**.

| Variable | Default | Must change in prod? |
|----------|---------|----------------------|
| `DATABASE_URL` | `sqlite:///./fleet_violations.db` | Yes (Postgres/MySQL) |
| `SECRET_KEY` | dev key | **Yes** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | Optional |
| `CORS_ORIGINS` | `http://localhost:5173` | **Yes** |
| `WEBHOOK_API_KEY` | `dashcam-webhook-secret-key` | **Yes** |

### 3.3 Auth (`core/security.py`, `dependencies.py`)

- JWT HS256, 120-minute TTL by default.
- `get_current_user` dependency extracts `Authorization: Bearer <token>`, decodes with `SECRET_KEY`, loads the `User` by `sub` (username), and 401s on any failure.
- `require_roles(*roles)` is a dependency factory returning a FastAPI dependency that 403s unless `current_user.role` matches. Use it on every protected route.

### 3.4 Upload and webhook auth (`routers/uploads.py`, `routers/webhook.py`)

Two API-key models coexist:

1. **Global webhook key** (`WEBHOOK_API_KEY`) -- used by `simulate_camera.py` and any external integrator.
2. **Per-camera key** -- 64-char hex token generated on camera registration (`secrets.token_hex(32)`), stored on `Camera.api_key`. Can be regenerated.

Uploads and the webhook accept either key, checked in order (global first, then per-camera lookup). **There is no JWT on these endpoints** -- the camera is a headless client.

### 3.5 Signaling router (`routers/signaling.py`)

WebSocket endpoint `/api/ws/signaling/{camera_id}`. Per-camera room in a module-level `defaultdict(dict)`:

```python
rooms[camera_id] = {"publisher": WebSocket | None, "viewers": [WebSocket, ...]}
```

- Clients register with a JSON message `{"role": "publisher" | "viewer"}`.
- Publisher broadcasts `publisher-joined` to existing viewers; a newly joined viewer receives `publisher-available`.
- Relay message types: `offer`, `answer`, `ice-candidate`. Optional `viewer_idx` routes a publisher-side message to a specific viewer.
- On disconnect the slot is cleared; the room is removed when empty. There is **no persistence, no auth, and no reconnection protocol** -- clients must re-offer on drop.

### 3.6 Scoring service (`services/scoring_engine.py`)

See [Section 8](#8-scoring-engine-internals) for the algorithm. Callers: the webhook handler (on violation create), the review endpoint (on status change), and the admin recalculation endpoint.

### 3.7 Database models

SQLite in dev, single file. SQLAlchemy 2.0 style, classic `Base.metadata.create_all` bootstrap. Major relationships:

- `Company 1--* Vehicle`
- `Company 1--* Driver`
- `Driver 1--1 User` (nullable -- drivers don't need a login)
- `Driver 1--* Violation`
- `Driver 1--* SafetyScore` (one row per `(driver_id, month)`)
- `Vehicle 1--? Camera`

`Violation.penalty_points` is **denormalized** -- it's written once at create time via `scoring_engine.get_penalty_points(event_type)`. If you change the penalty map, existing rows keep their historical values (good for auditability, annoying if you want a true recalc).

---

## 4. Frontend Deep Dive

### 4.1 Entry and routing

- `main.jsx` -> `App.jsx` -> `routes/index.jsx`. Routes are wrapped in `ProtectedRoute` with an optional `roles={[...]}` guard.
- `AuthContext` stores `{ token, user }` in `localStorage` as `fvm_token` / `fvm_user` and restores on reload.

### 4.2 API client (`services/index.js`)

- Single Axios instance with base URL `/api`.
- Request interceptor attaches `Authorization: Bearer <token>`.
- Response interceptor clears auth and redirects to `/login` on 401.
- Dev CORS is bypassed by Vite's proxy (`/api` -> `http://127.0.0.1:8000`, `/api/ws` -> `ws://127.0.0.1:8000`).

### 4.3 Hooks

| Hook | Summary |
|------|---------|
| `useWebRTCPublisher` | Opens WS, registers as publisher, creates one `RTCPeerConnection` per viewer, attaches local `MediaStream` tracks, handles ICE, and exposes `peerCount`. |
| `useWebRTCViewer` | Opens WS as viewer, adds `recvonly` transceivers, generates SDP offer, collects remote track into `remoteStream`. |
| `useMediaRecorderBuffer` | Maintains a rolling buffer of 1-second `MediaRecorder` chunks (default 20 s). `captureClip()` keeps recording for `postMs` more then resolves with a merged WebM blob. `captureSnapshot()` draws to canvas -> JPEG blob. |
| `useViolationAlerts` | Plays Web Audio tones (sawtooth for high, sine for low/med), a red-flash DOM overlay, `navigator.vibrate`, and `speechSynthesis` queue. Safe to call repeatedly -- each call debounces per type. |
| `useStopSignCamera` | Loads COCO-SSD once, runs a 250 ms polling loop, returns `{ isModelReady, startDetection, stopDetection }`. Emits detections via callback -- no global state. |
| `useStopSignFusion` | Pure logic hook: given live GPS + OSM signs + camera detections, decides priority and emits alerts/violations with cooldowns. |
| `usePermission` | Thin wrapper over `AuthContext.user.role` returning named booleans. Always prefer these over raw role comparisons in JSX. |

### 4.4 Important pages

- **`pages/cameras/DriverCamera.jsx`** -- the biggest component. Wires face detection + stop-sign detection + MediaRecorder + WebRTC publisher + heartbeat + alerts. If it feels tangled, blame this one first.
- **`pages/monitoring/ManagerMonitoring.jsx`** -- grid of camera cards; clicking opens a WebRTC viewer in a modal/drawer.
- **`pages/violations/ViolationDetail.jsx`** -- review state machine UI; triggers scoring recompute on dismiss.

### 4.5 Shared constants (`constants/index.js`)

Before hard-coding a role, color, event type, or status, check this file -- almost every enum already exists.

---

## 5. Detection Pipelines

Two independent detectors run inside `DriverCamera.jsx`, each on its own loop:

### 5.1 Face (MediaPipe FaceLandmarker)

- Model + WASM loaded from Google CDN (jsdelivr + storage.googleapis.com). **Offline = no face detection.**
- Loop driven by `requestAnimationFrame`.
- Reads blend shapes per frame; drowsiness uses `(eyeBlinkLeft + eyeBlinkRight) / 2`, yawning uses `jawOpen`.
- Thresholds and frame counts are the main knobs (see README table). Tune them in `DriverCamera.jsx`; there's no config file for these yet.
- Draws eye/mouth contours on a transparent canvas overlay for driver feedback.

### 5.2 Stop sign (TensorFlow.js + COCO-SSD)

- `cocoSsd.load({ base: 'mobilenet_v2' })` runs on WebGL.
- `setInterval(..., 250)` polls the video element.
- Confidence 0.28 base / 0.22 on a 2x center crop; 2-frame consecutive confirmation.
- A detection alone does **not** create a violation -- it goes to the fusion engine.

### 5.3 Fusion engine (`useStopSignFusion`)

Decision table (`distance`, `speed`) -> priority:

| Distance | Speed | Priority | Effect |
|----------|-------|----------|--------|
| > 150 m | any | `NONE` | -- |
| <= 150 m | > 15 km/h | `INFO` | Early voice hint |
| <= 100 m | > 15 km/h | `WARNING` | Banner + siren |
| <= 50 m | any | `URGENT` | Louder siren |
| < 50 m | > 30 km/h | `VIOLATION` | Records `stop_sign_violation` (25 pts) |

Camera detection is only trusted when an OSM sign is within 50 m of the current GPS fix -- this cuts false positives from billboards/advertisements.

Cooldowns: 5 s alert, 10 s violation, per sign.

### 5.4 Simulated vehicle sensors

Speed fluctuates randomly in the UI; harsh braking and sudden acceleration events fire probabilistically. These are demo-only -- swap them for a real CAN/OBD integration when going to production.

---

## 6. WebRTC Signaling Protocol

Minimal JSON-over-WebSocket protocol. Always wrapped in `{type, ...payload}`.

### 6.1 Messages

| Type | Direction | Payload |
|------|-----------|---------|
| `role` | client -> server | `{role: "publisher" \| "viewer"}` |
| `publisher-joined` | server -> viewers | none |
| `publisher-available` | server -> newly-joined viewer | none |
| `publisher-left` | server -> viewers | none |
| `offer` | viewer -> publisher | `{sdp}` |
| `answer` | publisher -> viewer | `{sdp, viewer_idx}` |
| `ice-candidate` | either | `{candidate, viewer_idx?}` |

### 6.2 Lifecycle

1. Driver opens DriverCamera -> `useWebRTCPublisher` connects, sends `role:publisher`.
2. Manager clicks a camera -> `useWebRTCViewer` connects, sends `role:viewer`.
3. Viewer receives `publisher-available`, sends `offer` with local SDP.
4. Publisher creates a per-viewer `RTCPeerConnection`, sets remote description, returns `answer`.
5. Both sides exchange `ice-candidate` until connection state becomes `connected`.
6. P2P media flows directly; signaling WS stays open for further ICE trickles.

### 6.3 ICE config

Single Google STUN (`stun:stun.l.google.com:19302`). **No TURN.** This is fine for same-network demos but will fail behind symmetric NATs / strict firewalls. Add a TURN server (Coturn, Twilio) before any real rollout.

---

## 7. Evidence Capture Pipeline

```
[frame] ---> <video>
                |
                +-> MediaRecorder (1s chunks, rolling 20s)       useMediaRecorderBuffer
                +-> canvas.toBlob (on detection)                 useMediaRecorderBuffer
                |
                v
        violation detected
                |
                +-> POST /api/uploads/snapshot (multipart)  -> url
                +-> wait 10s, stop recorder                  -> blob
                +-> POST /api/uploads/clip (multipart)       -> url
                +-> PATCH /api/violations/{id}/clip          (attaches url to record)
```

- Snapshot is ~5-30 KB JPEG.
- Clip is WebM ~1-3 MB for 15 s at 640x480.
- Both are stored on disk under `backend/uploads/` and served statically at `/uploads/...`. **There is no object storage yet** -- disk fills up quickly; rotate in prod.

---

## 8. Scoring Engine Internals

```python
# backend/app/services/scoring_engine.py
PENALTY_MAP = {
  "stop_sign_violation": 25,
  "drowsiness": 20,
  "phone_usage": 15,
  "distracted": 15,
  "no_seatbelt": 10,
  "overspeed": 7,
  "harsh_braking": 5,
  "yawning": 5,
  "sudden_acceleration": 5,
  "stop_sign_detected": 0,
}
```

`calculate_monthly_score(db, driver_id, "YYYY-MM")` does:

1. Sum `Violation.penalty_points` for that driver in that month, excluding `review_status == "dismissed"`.
2. `final_score = max(0, 100 - total_penalty)`.
3. Risk level: `>=90 Low / >=75 Moderate / >=60 High / else Critical`.
4. Upsert the `SafetyScore` row for `(driver_id, month)`.

Called from:
- `routers/webhook.py` after inserting a violation
- `routers/violations.py` after a review status change
- `routers/safety_scores.py` (admin recalc)

**Remember:** `Violation.penalty_points` is frozen at insert time. Changing the map retroactively only affects new violations unless you also run the admin recalc -- and the recalc uses the old row values unless you extend it to recompute per-row. This is intentional for audit but worth calling out in review.

---

## 9. Environment & Configuration

### 9.1 Required permissions (browser)

The Driver Camera page requests:
- **Camera** (`getUserMedia`) -- required
- **Microphone** -- requested with video (not stored currently, but required on some browsers for AV sync)
- **Geolocation** (`navigator.geolocation`) -- required for stop-sign fusion; without it the fusion engine runs with camera-only detection and cannot record `stop_sign_violation`
- **Vibration API** -- optional
- **Web Speech API** (`speechSynthesis`) -- optional

### 9.2 HTTPS requirement

`getUserMedia` only works on secure origins (`https://` or `localhost`). In production, put the frontend behind TLS *and* the WebSocket (`wss://`).

### 9.3 External dependencies the frontend pulls at runtime

| Resource | Used for | Offline impact |
|----------|----------|----------------|
| `cdn.jsdelivr.net/.../@mediapipe/tasks-vision/wasm` | MediaPipe WASM | Face detection silently disabled |
| `storage.googleapis.com/mediapipe-models/face_landmarker/...` | Face model | Face detection silently disabled |
| COCO-SSD weights (TF Hub) | Stop sign model | Stop sign detection fails to init |
| `stun.l.google.com:19302` | WebRTC STUN | Viewers can't connect across NAT |
| OSM Overpass API | Nearby traffic signs | Fusion engine falls back to camera-only |

For a truly air-gapped deployment, mirror MediaPipe + TF weights locally and point the code at your CDN.

---

## 10. Extending the System

### 10.1 Adding a new violation type

1. **Backend**
   - Add to `PENALTY_MAP` in `services/scoring_engine.py`.
   - If a new enum is used, update any related Pydantic schemas/validators in `schemas/violation.py`.
2. **Frontend**
   - Add the type + label + color + penalty to `constants/index.js` (`EVENT_TYPES`).
   - Wire a detection trigger (new hook, new button, or extend an existing hook).
3. **Verify**
   - Confirm dashboard charts pick up the new type automatically (they aggregate by `event_type`).
   - Regenerate a weekly report and confirm the breakdown shows the new category.

### 10.2 Adding a new in-browser detector

1. Create a new hook under `frontend/src/hooks/use<Name>Detector.js`. Follow the shape of `useStopSignCamera` (own loop, own model lifecycle, callback-based emission).
2. Mount it in `DriverCamera.jsx`, feed its output into a fusion step if needed, and call `triggerViolation` from `useViolationAlerts`.
3. Keep the detection loop **off** the main render loop if possible -- prefer `setInterval` or an offscreen canvas worker.

### 10.3 Adding a new role

1. Add to `ROLES` in `constants/index.js` and to the Python enum / string checks used by `require_roles(...)`.
2. Update `usePermission` with named capabilities.
3. Adjust `AppLayout.jsx` sidebar to hide items the role cannot access.
4. Extend `seed.py` with a demo account.

### 10.4 Integrating a real camera (vs. browser webcam)

Use the webhook path instead of the browser path:

- Register a camera via `POST /api/cameras` to get an API key.
- Camera firmware POSTs violations to `/api/webhook/violation` with `X-API-Key`.
- For clips, POST to `/api/uploads/clip` and then PATCH the violation with the returned URL.
- Heartbeat every 15-30 s to `/api/cameras/heartbeat`.

---

## 11. Testing & Demo Workflows

There is **no automated test suite yet** -- that's a known gap. Use the following manual flows.

### 11.1 Smoke test

1. `python seed.py` -> `uvicorn ...` -> `npm run dev`.
2. Log in as `admin`. Dashboard should show the seeded counts (0 violations initially).
3. Run `python simulate_camera.py --count 20 --interval 1`. Refresh dashboard -> violations and risk chart populate.
4. Log out. Log in as `driver1`, start camera, wait for a drowsiness or yawning trigger.
5. Log in as `manager` in a second window, open Monitoring, click the demo webcam card -> live feed should render within a few seconds.

### 11.2 Stop sign test (without a real sign)

- In Dev Tools, call the test utility exposed on `DriverCamera` (if enabled) or temporarily lower the COCO-SSD threshold in `useStopSignCamera.js` to trigger on ambient objects.
- Alternatively, print a stop sign image and hold it to the webcam -- COCO-SSD recognizes real printed signs reliably in good light.

### 11.3 Review workflow

Open any violation in `manager` or `admin` -> move through `pending -> under_review -> confirmed/dismissed`. Confirm the driver's monthly score updates in the Drivers page.

---

## 12. Gotchas & Known Issues

- **Schema drift**: no Alembic. If you add a column, existing dev DBs won't get it until you `rm fleet_violations.db && python seed.py`. Don't ship this to prod without migrations.
- **CORS + credentials**: `allow_origins` is set from env and currently `allow_credentials=True`. If you widen origins to `*`, browsers will reject credentialed requests.
- **Evidence retention**: clips pile up in `backend/uploads/clips/`. There is no retention job. Add one before the disk fills.
- **No TURN**: see [Section 6.3](#63-ice-config). WebRTC may fail on many real networks.
- **Mediapipe CDN**: offline or blocked = face detection silently disabled with only a console warning.
- **Frozen penalty points**: see end of [Section 8](#8-scoring-engine-internals).
- **`permissions.py` trailing whitespace**: there is an uncommitted cosmetic change on `return current_user`. Drop or revert it before committing feature work to keep diffs clean.
- **Driver self-service is limited**: drivers can only operate the camera. There's no driver-facing "my score" view yet -- add one when product asks.

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login 401 immediately after logging in | `SECRET_KEY` changed since the token was issued | Clear `localStorage`, log in again |
| "Camera not ready" banner never clears | Browser blocked the camera permission | Click the padlock -> reset site permissions -> reload |
| Face detection overlay never appears, no errors | MediaPipe CDN blocked by network | Check console; whitelist `jsdelivr.net` + `storage.googleapis.com` or self-host |
| Viewer sees "connecting..." forever | STUN blocked / symmetric NAT / no TURN | Test on the same LAN; add TURN for real deploys |
| Violation created but clip URL stays `null` | Upload failed or browser closed before 10 s post-roll finished | Check browser console; re-trigger with camera open for longer |
| Dashboard stuck on "loading" | Backend down or CORS misconfigured | `curl http://localhost:8000/api/health` -> `{"status":"ok"}` |
| Simulator says "Cannot connect" | Backend not running on `:8000` or wrong `--url` | Start backend; pass `--url` explicitly |
| Scores look wrong after reviewing | Review handler didn't recompute | Hit `POST /api/safety-scores/recalculate?month=YYYY-MM` as admin |

---

## 14. Release Checklist

Before cutting a real (non-demo) deployment, verify:

- [ ] `SECRET_KEY` and `WEBHOOK_API_KEY` overridden via env (not default)
- [ ] `DATABASE_URL` points at a real managed DB; Alembic migrations introduced
- [ ] `CORS_ORIGINS` tightened to the real frontend origin(s)
- [ ] Frontend served over HTTPS; WebSocket upgraded to `wss://`
- [ ] TURN server configured; ICE server list updated in `constants/index.js`
- [ ] Upload storage moved off local disk (S3 / GCS / Azure) or a retention job is in place
- [ ] MediaPipe + TF.js assets self-hosted or CDN access explicitly allowed
- [ ] Alembic schema + seed for production (no demo users)
- [ ] Structured logging + error reporting (Sentry or similar) wired up
- [ ] Rate limiting on `/api/webhook/violation` and `/api/uploads/*`

---

*Last updated: keep this file in lockstep with code. If you break an invariant documented here, update the doc in the same PR.*
