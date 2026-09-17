# BlockSub Native SOL Escrow

This repository contains the Anchor program and unsigned transaction builders for a native SOL milestone escrow.

## On-chain instructions

- `create_escrow`: creates the escrow and vault, then atomically funds the vault with lamports.
- `create_milestone`: creates one uniquely indexed milestone.
- `release_milestone`: requires the client's signature and pays the stored freelancer address.
- `cancel_escrow`: closes the active escrow and vault and refunds the remaining lamports to the client.
- `close_completed_escrow`: closes completed accounts and returns their remaining rent to the client.

There is no SPL token, USDC, separate funding, work-submission, or dispute instruction in this MVP.

## Setup

Install Anchor CLI, Solana CLI, Rust, and Node.js. Then:

```bash
solana config set --url devnet
solana-keygen new -o ~/.config/solana/id.json
solana airdrop 2
anchor build
anchor keys list
```

Replace `REPLACE_WITH_PROGRAM_ID` in `Anchor.toml` and `programs/blocksub/src/lib.rs` with the generated program ID, then deploy:

```bash
anchor build
anchor deploy --provider.cluster devnet
```

The generated IDL is at `target/idl/blocksub.json`. The Node server helpers are in `server/src/blocksub.ts`; they build unsigned transactions only. Wallets must sign them.

```bash
cd server
npm install
```

Set server environment variables:

```bash
export BLOCKSUB_PROGRAM_ID=your_program_id
export SOLANA_RPC_URL=https://api.devnet.solana.com
```

Amounts are lamports: `1 SOL = 1000000000`.

## Security

This is an MVP and has not been audited. Use devnet only until an independent security review is complete. Never put a wallet secret key in the server or repository. The current approval model requires the client to sign each release; dispute and timeout mechanisms are intentionally not included.
