# BlockSub Escrow API

The backend builds real unsigned Anchor transactions and reads real Solana devnet data. It never signs user transactions or stores wallet private keys.

## Native SOL escrow flow

1. Authenticate with the API.
2. Verify the client wallet by signing a message in the wallet application.
3. Call `POST /api/escrows/transactions/create`.
4. Decode and sign the returned base64 transaction in Phantom or another wallet.
5. Submit it to Solana and call `POST /api/escrows/:address/sync`.
6. Create milestones with `POST /api/escrows/:address/transactions/milestones`.
7. The client signs release transactions from `POST /api/escrows/:address/transactions/release`.
8. The client can cancel an active escrow using the cancellation endpoint.

The server only prepares transactions. The wallet must sign and submit them.

## Wallet intelligence

`POST /api/reputation/wallet/:address/scan` queries real Solana RPC history and stores a MongoDB summary. It reports balance, observed SOL flows, transaction count, timestamps, failed-transaction signals, and evidence signatures.

It deliberately returns `realizedPnlLamports: null`. Native SOL balance deltas are not profit. Reliable P/L requires a supported transaction classifier, token pricing history, cost-basis accounting, and transfer/self-wallet detection. The API does not label a wallet safe or a scammer.

## Required setup

```bash
anchor build
cd server
npm install
cp .env.example .env
npm run typecheck
npm run build
npm run dev
```

Required environment variables:

```env
MONGODB_URI=your_rotated_mongodb_uri
JWT_SECRET=at_least_32_random_characters
SOLANA_RPC_URL=https://api.devnet.solana.com
BLOCKSUB_PROGRAM_ID=deployed_program_id
BLOCKSUB_IDL_PATH=target/idl/blocksub.json
```

The MongoDB password previously shared in chat should be rotated before use.
