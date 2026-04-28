# Accounting

Full-stack application for accounting assets by military/company units. The app supports registration, login, protected routes, unit management, asset creation/editing/deletion, search, filtering, and total asset cost summaries.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Apollo Client
- Backend: Node.js, Express, Apollo Server, GraphQL, TypeScript
- Database: MongoDB, Mongoose
- Auth: JWT, bcrypt
- Dev environment: Docker Compose

## Project Structure

```text
.
├── client/                 # React + Vite frontend
│   ├── src/apollo/         # Apollo Client setup
│   ├── src/components/     # Shared UI components
│   ├── src/graphql/        # GraphQL operations
│   ├── src/pages/          # App pages
│   ├── src/routes/         # Protected route logic
│   └── src/types/          # Frontend TypeScript types
├── server/                 # Express + Apollo GraphQL backend
│   ├── src/config/         # Database config
│   ├── src/constants/      # Shared backend constants
│   ├── src/graphql/        # GraphQL schema and resolvers
│   ├── src/models/         # Mongoose models
│   └── src/index.ts        # Server entrypoint
├── docker-compose.yml
└── README.md
```

## Environment Variables

Create a `.env` file in the project root.

For Docker:

```env
PORT=5001
MONGO_URI=mongodb://mongo:27017/accounting
JWT_SECRET=change_this_secret
VITE_API_URL=http://localhost:5001/graphql
```

For local development without Docker:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/accounting
JWT_SECRET=change_this_secret
VITE_API_URL=http://localhost:5001/graphql
```

Do not commit real secrets.

## Run With Docker

Start the whole project:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- GraphQL API: http://localhost:5001/graphql
- MongoDB: localhost:27017

Stop containers:

```bash
docker compose down
```

Stop containers and remove MongoDB volume:

```bash
docker compose down -v
```

## Run Locally

You need Node.js, npm, and MongoDB running locally.

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Start backend:

```bash
cd server
npm run dev
```

Start frontend in another terminal:

```bash
cd client
npm run dev
```

Open:

- Frontend: http://localhost:5173
- GraphQL API: http://localhost:5001/graphql

## Useful Commands

Frontend:

```bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd server
npm run dev
npm run build
npm start
```

Docker:

```bash
docker compose up --build
docker compose down
docker compose logs -f server
docker compose logs -f client
docker compose logs -f mongo
```

## Main Features

- User registration and login
- JWT-based protected routes
- Create and list units
- Create, edit, delete, search, and filter assets
- Asset type enum: printer, laptop, monitor, phone, tablet, other
- Asset total cost summary
- Per-user data isolation on the backend

## GraphQL API

Main queries:

- `me`
- `units`
- `unit(id: ID!)`
- `assets`
- `asset(id: ID!)`
- `assetsByUnit(unitId: ID!)`

Main mutations:

- `register(name, email, password)`
- `login(email, password)`
- `createUnit(name)`
- `updateUnit(id, name)`
- `deleteUnit(id)`
- `createAsset(...)`
- `updateAsset(...)`
- `deleteAsset(id)`

## Notes

- The client uses `VITE_API_URL` and falls back to `http://localhost:5001/graphql`.
- The backend reads `.env` from the project root.
- When using Docker, `MONGO_URI` should use the Compose service name `mongo`.
- When running locally, `MONGO_URI` should use `localhost`.
