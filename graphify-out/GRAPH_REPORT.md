# Graph Report - .  (2026-04-22)

## Corpus Check
- Large corpus: 495 files · ~105,387 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 353 nodes · 444 edges · 63 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Schemas & Models|Backend Schemas & Models]]
- [[_COMMUNITY_Backend Domain Models|Backend Domain Models]]
- [[_COMMUNITY_Frontend App Shell & Hooks|Frontend App Shell & Hooks]]
- [[_COMMUNITY_System Architecture & Rationales|System Architecture & Rationales]]
- [[_COMMUNITY_Dashboard & Realtime Monitoring|Dashboard & Realtime Monitoring]]
- [[_COMMUNITY_Violation Ingestion & Scoring|Violation Ingestion & Scoring]]
- [[_COMMUNITY_Auth, Security & Notifications|Auth, Security & Notifications]]
- [[_COMMUNITY_Camera CRUD & API Keys|Camera CRUD & API Keys]]
- [[_COMMUNITY_Stop Sign Geo Simulation|Stop Sign Geo Simulation]]
- [[_COMMUNITY_Camera Simulator CLI|Camera Simulator CLI]]
- [[_COMMUNITY_Company CRUD|Company CRUD]]
- [[_COMMUNITY_Vehicle CRUD|Vehicle CRUD]]
- [[_COMMUNITY_Safety Score Endpoints|Safety Score Endpoints]]
- [[_COMMUNITY_OSM Traffic Sign Caching|OSM Traffic Sign Caching]]
- [[_COMMUNITY_WebRTC Streaming|WebRTC Streaming]]
- [[_COMMUNITY_FCM Push Notifications|FCM Push Notifications]]
- [[_COMMUNITY_Role-Based Access Control|Role-Based Access Control]]
- [[_COMMUNITY_Driver Schemas|Driver Schemas]]
- [[_COMMUNITY_ClipSnapshot Uploads|Clip/Snapshot Uploads]]
- [[_COMMUNITY_Frontend FCM Client|Frontend FCM Client]]
- [[_COMMUNITY_Evidence Capture Buffer|Evidence Capture Buffer]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Stop Sign Event Bus|Stop Sign Event Bus]]
- [[_COMMUNITY_Reports & Review Workflow|Reports & Review Workflow]]
- [[_COMMUNITY_Vite + React Toolchain|Vite + React Toolchain]]
- [[_COMMUNITY_FastAPI Main Entry|FastAPI Main Entry]]
- [[_COMMUNITY_Camera List View|Camera List View]]
- [[_COMMUNITY_Database Session|Database Session]]
- [[_COMMUNITY_Permission Dependency|Permission Dependency]]
- [[_COMMUNITY_Signaling WebSocket|Signaling WebSocket]]
- [[_COMMUNITY_App Root Component|App Root Component]]
- [[_COMMUNITY_Event Type Tag|Event Type Tag]]
- [[_COMMUNITY_Stat Card UI|Stat Card UI]]
- [[_COMMUNITY_Severity Tag|Severity Tag]]
- [[_COMMUNITY_Risk Badge|Risk Badge]]
- [[_COMMUNITY_Review Workflow UI|Review Workflow UI]]
- [[_COMMUNITY_Risk Distribution Chart|Risk Distribution Chart]]
- [[_COMMUNITY_Violation Trend Chart|Violation Trend Chart]]
- [[_COMMUNITY_Score Trend Chart|Score Trend Chart]]
- [[_COMMUNITY_Violation Type Chart|Violation Type Chart]]
- [[_COMMUNITY_Driver Detail Page|Driver Detail Page]]
- [[_COMMUNITY_Reports Page|Reports Page]]
- [[_COMMUNITY_Violation Detail Page|Violation Detail Page]]
- [[_COMMUNITY_Vehicle List Page|Vehicle List Page]]
- [[_COMMUNITY_Stop Sign Simulation Page|Stop Sign Simulation Page]]
- [[_COMMUNITY_Package Init (a)|Package Init (a)]]
- [[_COMMUNITY_Package Init (b)|Package Init (b)]]
- [[_COMMUNITY_Package Init (c)|Package Init (c)]]
- [[_COMMUNITY_Package Init (d)|Package Init (d)]]
- [[_COMMUNITY_Package Init (e)|Package Init (e)]]
- [[_COMMUNITY_Package Init (f)|Package Init (f)]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Frontend Entry Point|Frontend Entry Point]]
- [[_COMMUNITY_Components Index|Components Index]]
- [[_COMMUNITY_API Index|API Index]]
- [[_COMMUNITY_API Client|API Client]]
- [[_COMMUNITY_Stop Sign Index|Stop Sign Index]]
- [[_COMMUNITY_Firebase Service Worker|Firebase Service Worker]]
- [[_COMMUNITY_Simulated Vehicle Sensors|Simulated Vehicle Sensors]]
- [[_COMMUNITY_firebase-admin Dependency|firebase-admin Dependency]]
- [[_COMMUNITY_python-multipart Dependency|python-multipart Dependency]]
- [[_COMMUNITY_python-dotenv Dependency|python-dotenv Dependency]]

## God Nodes (most connected - your core abstractions)
1. `ViolationResponse` - 10 edges
2. `get_dashboard_data()` - 9 edges
3. `FastAPI Backend` - 9 edges
4. `ViolationByType` - 8 edges
5. `TopViolator` - 8 edges
6. `generate_report()` - 8 edges
7. `seed()` - 7 edges
8. `calculate_monthly_score()` - 7 edges
9. `_violation_to_response()` - 7 edges
10. `_enrich()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Frontend HTML Entry (index.html)` --implements--> `React Frontend (Vite + Antd)`  [INFERRED]
  frontend/index.html → README.md
- `Dashboard()` --calls--> `get_dashboard_data()`  [INFERRED]
  frontend/src/pages/dashboard/Dashboard.jsx → backend/app/services/dashboard_service.py
- `FastAPI Backend` --references--> `fastapi 0.115.0`  [EXTRACTED]
  README.md → backend/requirements.txt
- `FastAPI Backend` --references--> `uvicorn[standard] 0.32.0`  [EXTRACTED]
  README.md → backend/requirements.txt
- `FastAPI Backend` --references--> `pydantic 2.10.0`  [EXTRACTED]
  README.md → backend/requirements.txt

## Hyperedges (group relationships)
- **Browser-based AI detection pipeline** — readme_mediapipe_face_landmarker, readme_tensorflowjs_coco_ssd, readme_drowsiness_detection, readme_yawning_detection, readme_distraction_detection, readme_stop_sign_detection [EXTRACTED 0.95]
- **WebRTC P2P signaling flow** — readme_use_webrtc_publisher, readme_use_webrtc_viewer, readme_websocket_signaling, readme_stun_server, readme_fastapi_backend [EXTRACTED 0.95]
- **Automated evidence capture flow** — readme_use_media_recorder_buffer, readme_rolling_buffer, readme_evidence_capture, readme_camera_webhooks, readme_violation_review_workflow [EXTRACTED 0.90]

## Communities

### Community 0 - "Backend Schemas & Models"
Cohesion: 0.14
Nodes (24): LoginRequest, LoginResponse, RegisterRequest, UserResponse, BaseModel, DashboardData, FleetOverview, RiskDistribution (+16 more)

### Community 1 - "Backend Domain Models"
Cohesion: 0.1
Nodes (17): register(), Base, Camera, Company, Driver, create_driver(), _enrich_driver(), get_driver() (+9 more)

### Community 2 - "Frontend App Shell & Hooks"
Cohesion: 0.08
Nodes (12): AppLayout(), useAuth(), DriverCamera(), DriverList(), Login(), ProtectedRoute(), useMediaRecorderBuffer(), usePermission() (+4 more)

### Community 3 - "System Architecture & Rationales"
Cohesion: 0.09
Nodes (26): src/main.jsx entry script, Frontend HTML Entry (index.html), COCO-SSD Model Notes, useStopSignCamera.js hook, Camera Webhook Simulator, Camera Webhooks (X-API-Key), Distraction Detection, Drowsiness Detection (+18 more)

### Community 4 - "Dashboard & Realtime Monitoring"
Cohesion: 0.13
Nodes (14): Dashboard(), dashboard_overview(), get_dashboard_data(), get_fleet_overview(), get_recent_violations(), get_risk_distribution(), get_top_violators(), get_violation_trend() (+6 more)

### Community 5 - "Violation Ingestion & Scoring"
Cohesion: 0.19
Nodes (11): calculate_monthly_score(), get_penalty_points(), get_risk_level(), recalculate_all_scores(), Violation, create_violation(), get_violation(), list_violations() (+3 more)

### Community 6 - "Auth, Security & Notifications"
Cohesion: 0.14
Nodes (9): login(), camera_heartbeat(), get_current_user(), broadcast_event(), notifications_ws(), Broadcast an event to all connected WebSocket clients., create_access_token(), decode_access_token() (+1 more)

### Community 7 - "Camera CRUD & API Keys"
Cohesion: 0.24
Nodes (10): CameraBase, CameraCreate, CameraResponse, CameraUpdate, create_camera(), _enrich(), get_camera(), list_cameras() (+2 more)

### Community 8 - "Stop Sign Geo Simulation"
Cohesion: 0.27
Nodes (7): getDistance(), getNearbySigns(), buildMockTrafficSigns(), metersToLat(), metersToLng(), simulateApproachSequence(), simulateStopSignDetection()

### Community 9 - "Camera Simulator CLI"
Cohesion: 0.25
Nodes (10): generate_violation(), get_next_position(), main(), print_violation(), Fleet Violation Monitoring — Live Camera Simulator  Simulates AI dashcams sendin, Simulate GPS movement along a route., Generate a single realistic violation event., Send violation to webhook endpoint. (+2 more)

### Community 10 - "Company CRUD"
Cohesion: 0.31
Nodes (8): create_company(), get_company(), list_companies(), update_company(), CompanyBase, CompanyCreate, CompanyResponse, CompanyUpdate

### Community 11 - "Vehicle CRUD"
Cohesion: 0.31
Nodes (8): VehicleBase, VehicleCreate, VehicleResponse, VehicleUpdate, create_vehicle(), get_vehicle(), list_vehicles(), update_vehicle()

### Community 12 - "Safety Score Endpoints"
Cohesion: 0.28
Nodes (7): get_driver_scores(), FleetAverageResponse, SafetyScoreResponse, fleet_average(), get_latest_score(), list_scores(), recalculate()

### Community 13 - "OSM Traffic Sign Caching"
Cohesion: 0.36
Nodes (4): fetchTrafficSigns(), isCacheValid(), isWithinCachedArea(), prefetchRouteSigns()

### Community 14 - "WebRTC Streaming"
Cohesion: 0.29
Nodes (8): Rationale: No TURN (same-network deployment), Rationale: P2P WebRTC for live streaming, Google STUN Server, useWebRTCPublisher hook, useWebRTCViewer hook, WebRTC Peer-to-Peer Streaming, WebSocket Signaling, websockets 14.1

### Community 15 - "FCM Push Notifications"
Cohesion: 0.33
Nodes (6): Enum, _ensure_init(), Send FCM push notification for a new violation to given device tokens., send_violation_notification(), str, ReviewStatus

### Community 16 - "Role-Based Access Control"
Cohesion: 0.33
Nodes (6): ADMIN role, Role-Based Access Control, DRIVER role, MANAGER role, VIEWER role, usePermission hook

### Community 17 - "Driver Schemas"
Cohesion: 0.6
Nodes (4): DriverBase, DriverCreate, DriverResponse, DriverUpdate

### Community 18 - "Clip/Snapshot Uploads"
Cohesion: 0.8
Nodes (4): _save_file(), upload_clip(), upload_snapshot(), _validate_api_key()

### Community 19 - "Frontend FCM Client"
Cohesion: 0.6
Nodes (3): getMessagingInstance(), onForegroundMessage(), registerFCM()

### Community 20 - "Evidence Capture Buffer"
Cohesion: 0.5
Nodes (5): Evidence Capture (Snapshots & Clips), Rationale: 5s pre + 10s post evidence window, Rolling 20s MediaRecorder Buffer, useMediaRecorderBuffer hook, aiofiles 24.1.0

### Community 21 - "Backend Config"
Cohesion: 0.5
Nodes (3): BaseSettings, Config, Settings

### Community 22 - "Stop Sign Event Bus"
Cohesion: 0.67
Nodes (2): createEventId(), publishStopSignSimulation()

### Community 23 - "Reports & Review Workflow"
Cohesion: 0.5
Nodes (4): Dashboard & Analytics, Weekly/Monthly Reports, Monthly Safety Scoring Engine, Violation Review State Machine

### Community 24 - "Vite + React Toolchain"
Cohesion: 0.67
Nodes (4): @vitejs/plugin-react (Babel), @vitejs/plugin-react-swc, React Compiler, React + Vite template

### Community 25 - "FastAPI Main Entry"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Camera List View"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Database Session"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Permission Dependency"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Signaling WebSocket"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "App Root Component"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Event Type Tag"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Stat Card UI"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Severity Tag"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Risk Badge"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Review Workflow UI"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Risk Distribution Chart"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Violation Trend Chart"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Score Trend Chart"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Violation Type Chart"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Driver Detail Page"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Reports Page"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Violation Detail Page"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Vehicle List Page"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Stop Sign Simulation Page"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Package Init (a)"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Package Init (b)"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Package Init (c)"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Package Init (d)"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Package Init (e)"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Package Init (f)"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Frontend Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Components Index"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "API Index"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "API Client"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Stop Sign Index"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Firebase Service Worker"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Simulated Vehicle Sensors"
Cohesion: 1.0
Nodes (1): Simulated Vehicle Sensors

### Community 60 - "firebase-admin Dependency"
Cohesion: 1.0
Nodes (1): firebase-admin >=6.0.0

### Community 61 - "python-multipart Dependency"
Cohesion: 1.0
Nodes (1): python-multipart 0.0.12

### Community 62 - "python-dotenv Dependency"
Cohesion: 1.0
Nodes (1): python-dotenv 1.0.1

## Knowledge Gaps
- **36 isolated node(s):** `Fleet Violation Monitoring — Live Camera Simulator  Simulates AI dashcams sendin`, `Simulate GPS movement along a route.`, `Generate a single realistic violation event.`, `Send violation to webhook endpoint.`, `Pretty print the violation event.` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Database Session`** (2 nodes): `database.py`, `get_db()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Permission Dependency`** (2 nodes): `permissions.py`, `require_roles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Signaling WebSocket`** (2 nodes): `signaling.py`, `signaling()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Root Component`** (2 nodes): `App()`, `App.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Event Type Tag`** (2 nodes): `EventTypeTag()`, `EventTypeTag.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stat Card UI`** (2 nodes): `StatCard.jsx`, `StatCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Severity Tag`** (2 nodes): `SeverityTag.jsx`, `SeverityTag()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Risk Badge`** (2 nodes): `RiskBadge.jsx`, `RiskBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Review Workflow UI`** (2 nodes): `ReviewWorkflow.jsx`, `ReviewWorkflow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Risk Distribution Chart`** (2 nodes): `RiskDistributionChart.jsx`, `RiskDistributionChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Violation Trend Chart`** (2 nodes): `ViolationTrendChart.jsx`, `ViolationTrendChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Score Trend Chart`** (2 nodes): `ScoreTrendChart.jsx`, `ScoreTrendChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Violation Type Chart`** (2 nodes): `ViolationTypeChart.jsx`, `ViolationTypeChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Driver Detail Page`** (2 nodes): `DriverDetail()`, `DriverDetail.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reports Page`** (2 nodes): `Reports.jsx`, `Reports()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Violation Detail Page`** (2 nodes): `ViolationDetail.jsx`, `ViolationDetail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vehicle List Page`** (2 nodes): `VehicleList.jsx`, `VehicleList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stop Sign Simulation Page`** (2 nodes): `StopSignSimulation.jsx`, `StopSignSimulation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (a)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (b)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (c)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (d)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (e)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init (f)`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Entry Point`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Components Index`** (1 nodes): `index.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Index`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Client`** (1 nodes): `api.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stop Sign Index`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Firebase Service Worker`** (1 nodes): `firebase-messaging-sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Simulated Vehicle Sensors`** (1 nodes): `Simulated Vehicle Sensors`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `firebase-admin Dependency`** (1 nodes): `firebase-admin >=6.0.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `python-multipart Dependency`** (1 nodes): `python-multipart 0.0.12`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `python-dotenv Dependency`** (1 nodes): `python-dotenv 1.0.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_dashboard_data()` connect `Dashboard & Realtime Monitoring` to `Backend Schemas & Models`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `useRealtimeUpdates()` connect `Dashboard & Realtime Monitoring` to `Frontend App Shell & Hooks`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `ViolationResponse` (e.g. with `FleetOverview` and `ViolationTrend`) actually correct?**
  _`ViolationResponse` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_dashboard_data()` (e.g. with `DashboardData` and `Dashboard()`) actually correct?**
  _`get_dashboard_data()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `ViolationByType` (e.g. with `ViolationResponse` and `ReportRequest`) actually correct?**
  _`ViolationByType` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Fleet Violation Monitoring — Live Camera Simulator  Simulates AI dashcams sendin`, `Simulate GPS movement along a route.`, `Generate a single realistic violation event.` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Schemas & Models` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._