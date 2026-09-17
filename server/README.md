# Server

The server is intentionally separated from the Anchor program. It provides MongoDB-backed local authentication, optional Google OAuth, and protected API routes. It does not custody wallet keys and does not sign Solana transactions.

## Install and run

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Add `dev` and `typecheck` scripts to `server/package.json` as needed, or run `npx tsx src/index.ts` and `npx tsc --noEmit`.

## API

- `POST /api/auth/signup` body `{ email, password, name }`
- `POST /api/auth/login` body `{ email, password }`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/escrows/me` with `Authorization: Bearer <token>`

Google OAuth is optional. Create OAuth credentials in Google Cloud and set the three Google environment variables. Add the callback URL exactly as configured.

Never commit `.env`, JWT secrets, MongoDB credentials, or wallet secret keys.
