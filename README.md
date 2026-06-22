# 🦁 RangerNet — Wildlife Conservation Command

> Community-powered anti-poaching alerts for Kaduna State, Nigeria.  
> Built with Africa's Talking **USSD · SMS · Airtime** APIs.

---

## The Problem

A farmer in Kafanchan hears rustling at 2am. Suspected poachers. No internet. His smartphone is out of data. He has no way to reach rangers in time.

Meanwhile, rangers in the field can't coordinate fast enough. Community tips go unreported because there's no easy channel — and no incentive.

Wildlife is lost. The community stays silent.

## The Solution

RangerNet connects local communities, farmers, and ranger units through **standard feature phones** using Africa's Talking APIs — no internet, no smartphone required.

**The full loop:**

1. **Community member dials `*384#`** (USSD — works on any phone, offline)
2. **Selects incident type and zone** from a simple menu
3. **Rangers receive an instant SMS alert** with incident details and location zone
4. **Reporter receives ₦50 airtime** automatically as a community thank-you
5. **Ranger dashboard** shows live incident map, feed, and allows manual SMS broadcasts

---

## APIs Used

| API | How RangerNet Uses It |
|-----|----------------------|
| **USSD API** | Community incident reporting menu — works on feature phones with zero internet |
| **SMS API** | Real-time alerts dispatched to ranger units on every report + Emergency SOS broadcast |
| **Airtime API** | Automatic ₦50 airtime reward to community informants on successful report |

---

## Architecture

```
                  ┌─────────────────┐
  Feature Phone   │  Africa's        │
  dials *384#  ──►│  Talking USSD    │
                  │  Gateway         │
                  └────────┬────────┘
                           │ POST /ussd
                  ┌────────▼────────┐
                  │  RangerNet      │  Node.js / Express
                  │  Backend        │──────────────────────►  AT SMS API → Rangers
                  │                 │──────────────────────►  AT Airtime API → Reporter
                  └────────┬────────┘
                           │ REST /api/incidents
                  ┌────────▼────────┐
                  │  RangerNet      │  Next.js 15
                  │  Dashboard      │  Leaflet Map + Recharts
                  └─────────────────┘
```

---

## USSD Menu Flow

```
*384# → Welcome to RangerNet
  1. Report Incident
       1. Animal Near Crops
       2. Suspected Poaching
       3. Illegal Logging
       4. Other Emergency
            → Select Zone (North/South/East/West)
               → Confirm
                  → ✅ Rangers alerted · ₦50 airtime sent
  2. Check My Reports
  3. Emergency SOS (immediate SMS blast, no sub-menu)
  4. About RangerNet
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Africa's Talking account (sandbox for testing)

### 1. Clone & configure

```bash
git clone https://github.com/coolhillblack/rangernet.git
cd rangernet
cp .env.example .env
# Fill in your AT credentials in .env
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

- Dashboard: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

### 3. Local development (no Docker)

```bash
# Backend
cd backend
cp .env.example .env   # add your AT credentials
npm install
npm run dev

# Dashboard (new terminal)
cd dashboard
cp .env.example .env
npm install
npm run dev
```

### 4. Test the USSD flow

In Africa's Talking sandbox simulator:
- Set callback URL to: `https://your-ngrok-url.ngrok.io/ussd`
- Dial `*384#`
- Follow the menu

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `AT_USERNAME` | Africa's Talking username (use `sandbox` for testing) |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_SENDER_ID` | Alphanumeric sender ID (optional, leave blank in sandbox) |
| `RANGER_NUMBERS` | Comma-separated ranger phone numbers |
| `PORT` | Server port (default: 4000) |

### Dashboard (`dashboard/.env`)

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | RangerNet backend URL |

---

## Railway Deployment

### Backend
1. Create a new Railway project
2. Connect GitHub repo, set root to `/backend`
3. Add environment variables from `.env.example`
4. Railway auto-detects Docker and deploys

### Dashboard
1. Add another service in same project
2. Root directory: `/dashboard`
3. Set `BACKEND_URL` to the backend Railway URL

---

## Project Structure

```
rangernet/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ussd.js        ← USSD menu handler (all AT API calls)
│   │   │   ├── sms.js         ← Manual broadcast endpoint
│   │   │   ├── airtime.js     ← Reward disbursement
│   │   │   └── incidents.js   ← Incident CRUD
│   │   ├── at.js              ← Africa's Talking SDK init
│   │   ├── store.js           ← In-memory incident store
│   │   └── index.js           ← Express entry point
│   └── Dockerfile
├── dashboard/
│   ├── app/
│   │   ├── page.tsx           ← Main dashboard UI
│   │   ├── api/               ← Next.js proxy routes
│   │   └── globals.css
│   ├── components/
│   │   └── MapComponent.tsx   ← Leaflet incident map
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Impact

RangerNet directly addresses three of the hackathon's stated challenges:

- ✅ **Remote Field Reporting** — USSD works on any phone, no internet needed
- ✅ **Instant Critical Alerts** — SMS dispatched in real-time to ranger teams
- ✅ **Community Incentives** — Automatic airtime rewards close the participation loop

By making reporting effortless and rewarded, RangerNet builds a self-sustaining community network — the more people report, the faster rangers respond, the more wildlife is protected.

---

## Built At

**Wildlife & Conservation Hackathon — Kaduna, Nigeria**  
Africa's Talking Open Community · West Africa Hub · June 27, 2026

---

*Built by [Churchill](https://github.com/coolhillblack)*
