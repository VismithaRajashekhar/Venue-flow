#  VenueFlow — Smart Venue Experience Platform

> Real-time crowd intelligence, gate coordination, and AI-assisted navigation for large-scale sporting events.



---

##  Problem Statement

**Physical Event Experience** — Design a solution that improves the physical event experience for attendees at large-scale sporting venues. The system should address:
- Crowd movement & bottlenecks
- Waiting times at gates, concessions, and restrooms
- Real-time coordination between staff and attendees
- Seamless and enjoyable experience for all

---

##  Solution: VenueFlow

VenueFlow is a **real-time stadium operating system** that gives venue managers and attendees a live, unified view of the entire venue — crowd density, gate wait times, food queue lengths, and AI-assisted navigation — all in one dashboard.

###  Key Features

| Feature | Description |
|---|---|
|  **Live Crowd Heatmap** | Interactive canvas map showing real-time crowd density per section with color-coded severity |
|  **Gate Intelligence** | Live wait times for all gates, with automatic congestion alerts and rerouting suggestions |
|  **Real-Time Alerts** | Priority-based alert system for incidents, crowd surges, weather, parking, and medical events |
|  **Smart Navigation** | Crowd-aware route guidance from any seat to any destination (gates, food, restrooms, first aid) |
|  **Crowd Flow Analytics** | Live 2-hour chart of attendee inflow/outflow per entry point |
|  **Queue Management** | Live wait times for food courts, beverages, merchandise, and restrooms |
|  **Emergency Coordination** | Instant banner alerts for security/safety events with evacuation guidance |
| **Live Ticker** | Scrolling real-time status bar covering all venue zones |

---

##  Tech Stack

- **Frontend**: Vanilla HTML5 + CSS3 + JavaScript (no framework dependencies)
- **Visualization**: HTML5 Canvas API — custom heatmap renderer
- **Server**: Node.js + Express
- **Deployment**: Google Cloud Run (containerized via Docker)
- **Fonts**: Google Fonts (Bebas Neue, DM Sans, JetBrains Mono)
- **Data Simulation**: Real-time stochastic crowd simulation (5s refresh cycle)

---

##  Project Structure

```
venueflow/
├── index.html        # Full single-page application
├── server.js         # Express static server
├── package.json      # Node.js dependencies
├── Dockerfile        # Container config for Cloud Run
├── .gitignore
└── README.md
```

---

##  Local Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/venueflow.git
cd venueflow

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:8080
```

---

##  Deploy to Google Cloud Run

```bash
# 1. Authenticate
gcloud auth login

# 2. Set project
gcloud config set project YOUR_PROJECT_ID

# 3. Build & deploy in one command
gcloud run deploy venueflow \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080

# 4. Get the live URL
# Cloud Run will output: https://venueflow-XXXX-as.a.run.app
```

---

##  How to Use the Dashboard

1. **Crowd Heatmap** — Hover over any stadium section to see live density, crowd count & status
2. **Gate Status Panel** — Watch wait times update live every 5 seconds. Red = congested
3. **Navigation** — Enter your seat (e.g. `D-114`) and destination (e.g. `Gate B`, `Food Court`, `Restroom`) for crowd-aware routing
4. **Alerts** — Auto-refreshing priority alerts for security, crowd, and operational events
5. **Refresh button** — Force-refresh the heatmap & all data instantly

---

##  Architecture

```
Browser (Attendee / Staff) 
       ↓
  VenueFlow Dashboard (index.html)
       ↓
  Simulated Sensor Layer (JavaScript)
       │
  ┌────┴──────────────────────────────┐
  │  Crowd Density Engine             │
  │  Gate Wait Time Simulator         │
  │  Queue Length Tracker             │
  │  Alert Generation System          │
  │  AI Route Planner (rule-based)    │
  └───────────────────────────────────┘
       ↓
  Express Server (server.js)
       ↓
  Google Cloud Run
```

---

##  Built For

**Google Antigravity × Hack2Skill — Physical Event Experience Challenge 2026**

---

##  License

MIT License — free to use, modify, and distribute.
