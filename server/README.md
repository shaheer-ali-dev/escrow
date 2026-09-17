# Backend setup

The backend provides MongoDB persistence for users, profiles, escrows, milestones, chain events, and wallet analytics. It also includes signup/login, JWT authentication, Solana wallet ownership verification, profile routes, escrow read routes, and reputation read routes.

## Security

Never commit MongoDB credentials, JWT secrets, or wallet private keys. The MongoDB URI must be supplied through `server/.env` using `MONGODB_URI`.

The backend does not sign Solana transactions. Wallets sign transactions in the frontend. Native SOL escrow transactions are built by the existing blockchain helper and verified state can be persisted in these models.

## Run

```bash
cd server
cp .env.example .env
# Set MONGODB_URI and a random JWT_SECRET in .env
npm install
npm run dev
```

## Routes

- `POST /api/auth/signup` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `GET /api/profile` authenticated
- `PATCH /api/profile` authenticated
- `POST /api/profile/wallet/verify` authenticated; `{ walletAddress, message, signatureBase64 }`
- `GET /api/escrows` authenticated
- `GET /api/escrows/:address` authenticated
- `GET /api/reputation/wallet/:address`
- `GET /api/reputation/wallet/:address/events`

Use `Authorization: Bearer <token>` for authenticated requests.

Google OAuth is intentionally not enabled in this commit because OAuth credentials and callback URLs must be configured first. It can be added without changing the MongoDB models.
