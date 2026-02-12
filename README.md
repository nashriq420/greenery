# Greenery v2.0.0

A modern, production-ready subscription-based geo-mapped marketplace.

## Structure

- `backend/`: Node.js, Express, Prisma, PostgreSQL.
- `frontend/`: Next.js, Tailwind CSS, ShadCN UI, Leaflet.npx

## Setup Instructions

### Backend

1. Navigate to backend: `cd backend`
2. Install dependencies: `npm install`
3. Configure Database:
   - Ensure PostgreSQL is running.
   - Update `DATABASE_URL` in `.env`.
4. Initialize Database:
   - `npx prisma generate`
   - `npx prisma db push`
   - **Seed Data** (Optional): `npx ts-node prisma/seed.ts`
5. Start Server: `npm run dev`
   - Runs on <http://localhost:4000>

### Frontend

1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start Dev Server: `npm run dev`
   - Runs on <http://localhost:3000>

## Features

- **Auth**: Signup/Login with Role selection (Customer/Seller), JWT-based.
- **Dashboard**: Protected route, Role-based view.
- **Maps**: Interactive Leaflet map showing nearby Sellers (Radius search).
- **Marketplace**: Browse listings (Backend API ready).
- **Subscription**:
  - Free Tier vs Pro Tier.
  - Upgrade flow (Mocked).
  - Middleware enforcement for Pro features.

## Testing

- **Map**: Login -> Dashboard -> Map. It defaults to London coordinates.
- **Subscription**: Login -> Dashboard -> Upgrade to Pro.
