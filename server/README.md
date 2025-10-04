# BeFree Server

Express backend that pairs with the BeFree frontend client. It exposes JSON APIs for authentication, user profiles, sobriety logs, and milestone tracking.

## Getting started

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Copy the environment template and adjust as needed:
   ```bash
   cp .env.example .env
   ```
3. Run the development server (with hot reload):
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:5005` by default.

> **Tip:** Point the client at the API by setting `VITE_API_URL=http://localhost:5005/api` in `client/.env`.

## Available scripts

- `npm run dev` – start the API with `nodemon` reloads
- `npm start` – start the API with Node (production mode)

## Features

- JWT-based authentication with optional HTTP-only cookie session
- Password hashing via `bcryptjs`
- Simple JSON-file persistence (`server/data/db.json`)
- Automatic seeding of a demo account (`demo@befree.app` / `password123`)
- Default sobriety milestones generated per user

## API overview

Base URL: `http://localhost:5005/api`

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/auth/signup` | Create account, returns JWT + user payload |
| POST | `/auth/login` | Authenticate existing user |
| POST | `/auth/logout` | Clear session cookie |
| GET | `/auth/verify` | Validate token and fetch current user |
| PATCH | `/users/me` | Update profile fields (`name`, `email`, `addictionType`, `quitDate`) |
| PATCH | `/users/me/password` | Change password (requires current password) |
| GET | `/logs` | Fetch recent logs (`?limit=100` supported) |
| POST | `/logs` | Create a new log entry |
| GET | `/milestones` | Fetch user milestones (auto-seeded on first request) |
| PATCH | `/milestones/:milestoneId` | Update milestone status |

All endpoints except signup/login/logout require a valid `Authorization: Bearer <token>` header (the server also issues an HTTP-only cookie for browser clients).

## Data storage

The API persists data to `server/data/db.json`. Commit this file only if you want to share seeded data; otherwise add it to your `.gitignore`. Each write operation rewrites the file, so avoid editing it manually while the server is running.

## Folder structure

```
server/
├── data/               # JSON persistence layer
├── src/
│   ├── routes/         # Express route modules
│   ├── storage/        # Tiny data-access helpers
│   ├── middleware/     # Authentication & error handling
│   ├── app.js          # Express app builder
│   └── server.js       # Entry point
├── .env.example        # Configuration template
├── package.json
└── README.md
```
