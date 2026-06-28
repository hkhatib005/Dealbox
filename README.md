# DealBox 📦

A wholesale real estate deal-matching platform. Wholesalers submit **buy boxes** (criteria for the deals they want), and DealBox automatically matches distressed properties — foreclosures, probate, tax delinquent, and absentee-owner leads — against those criteria. Admins get full visibility into every buy box and user across the network.

## Features

- **Buy box submission** — define price range, beds/baths, target states, zip codes, deal types, and property condition
- **Automatic matching** — properties are matched to every active buy box the moment they enter the system
- **Deals feed** — filterable property cards showing ask price, estimated ARV, profit spread, and owner info
- **Map view** — nationwide Leaflet map with color-coded pins by deal type
- **Admin dashboard** — see all users, their buy boxes, match counts, and add/remove properties
- **Auth** — JWT-based login/registration, wholesaler and admin roles

## Tech Stack

- **Backend:** Python / Flask, SQLAlchemy, Flask-JWT-Extended, SQLite
- **Frontend:** React (Vite), React Router, Leaflet, Recharts, Lucide icons

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Runs on `http://localhost:5000`. On first boot it seeds an admin account and 20 demo properties.

**Default admin:** `admin@dealbox.com` / `admin123`

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api` to the backend.

## Project Structure
```
dealbox/
├── backend/
│   ├── app.py                 # Flask app + admin seeding
│   ├── database.py            # SQLAlchemy instance
│   ├── models/                # User, BuyBox, Property, PropertyMatch
│   ├── routes/                # auth, buybox, properties, admin
│   └── services/
│       ├── matcher.py         # buy box ↔ property matching logic
│       └── scraper.py         # property ingestion (demo seed + HUD scraper stub)
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx            # router
        ├── AuthContext.jsx    # auth state
        ├── api.js             # axios instance w/ JWT
        ├── components/Layout.jsx
        └── pages/             # Login, Register, Dashboard, BuyBoxes, Deals, MapView, AdminDashboard
```

## Going to Production

The data layer currently uses a demo seed in `services/scraper.py`. To make it pull real leads, replace `seed_demo_properties()` with live calls to:
- County assessor / tax-delinquent feeds (free, per county)
- HUD HomeStore and Fannie Mae HomePath (free public listings)
- Probate court records (free, per county)

Wholesalers do their own skip tracing on the matched addresses, keeping running costs at zero.

## License

MIT
