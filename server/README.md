# Full MVP backend

The API now exposes the combined freelancer reputation profile:

- `POST /api/reputation/wallet/:address/scan`
- `GET /api/reputation/wallet/:address/profile`
- `GET /api/reputation/wallet/:address/activity`
- `GET /api/reputation/wallet/:address/trading`
- `GET /api/reputation/wallet/:address/risk`
- `GET /api/reputation/wallet/:address/events`
- `GET /api/reputation/wallet/:address/evidence`

The scan performs real Solana RPC calls for native SOL history, token accounts, balances, counterparties, failed transactions, and protocol-account observations. The profile aggregates indexed BlockSub escrow records.

Trading fields remain `null` unless a supported transaction classifier and price source are configured. The service never represents SOL balance changes as P/L and never returns an absolute safe/scammer verdict.

Set `ENABLE_INDEXER=true` after deploying the Anchor program. The indexer polls recent program signatures and stores event evidence. Run `anchor build` first so the IDL exists, then run `npm run typecheck` and `npm run build`.
