# Smart Resource Allocation System — Frontend

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env
cp .env.example .env
# Edit REACT_APP_API_URL to point at your backend

# 3. Run dev server
npm start
```

Opens at http://localhost:3000

## Pages

| Page | Description |
|------|-------------|
| Dashboard | Live metrics, Leaflet map, recent allocations |
| Create Request | Submit a request — auto-allocates on submit |
| Resources | View/manage all field resources |
| Allocations | AI scoring breakdown for every allocation |

## Deploy on Vercel

```bash
npm install -g vercel
vercel
# Set env var REACT_APP_API_URL=https://your-backend.onrender.com
```

## Map

Uses react-leaflet + OpenStreetMap tiles (free, no API key needed).
- Green circles = available resources
- Blue circles = assigned resources
- Red/amber/green dots = requests by severity
