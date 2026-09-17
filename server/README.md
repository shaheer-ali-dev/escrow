# BlockSub Escrow API

This backend is purpose-built for the native-SOL escrow MVP. It includes:
- MongoDB users and profiles
- signup/login via JWT
- optional Google OAuth preparation
- escrow and milestone persistence
- wallet verification and reputation query routes
- clean separation of config, services, controllers, routes, and middleware

## Run locally

```bash
cd server
cp .env.example .env
# fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

## Auth endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

## Profile endpoints

- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/wallet/verify`

## Escrow endpoints

- `GET /api/escrows`
- `GET /api/escrows/:address`

## Reputation endpoints

- `GET /api/reputation/wallet/:address`
- `GET /api/reputation/wallet/:address/events`

Use `Authorization: Bearer <token>` for authenticated endpoints.

Do not commit `.env` or any wallet secret/key material.
