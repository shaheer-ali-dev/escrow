import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Initialize Solana connection
export const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  "confirmed"
);

// Program ID - UPDATE after deployment
export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "11111111111111111111111111111111"
);

// Seeds for PDAs
export const SUBSCRIPTION_SEED = "subscription";
export const ESCROW_SEED = "escrow";
export const MILESTONE_SEED = "milestone";

// Load IDL (generated after program deployment)
export let programIDL: any = null;

export const loadIDL = () => {
  try {
    const idlPath = path.join(
      __dirname,
      "../../idl/blocksub_escrow.json"
    );
    if (fs.existsSync(idlPath)) {
      programIDL = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    }
  } catch (error) {
    console.warn("IDL not found. Generate it after deployment with: anchor idl fetch");
  }
};

// Load payer keypair from environment or file
export const getPayerKeypair = (): Keypair => {
  const keyPath = process.env.PAYER_KEYPAIR_PATH;
  
  if (!keyPath) {
    throw new Error("PAYER_KEYPAIR_PATH environment variable not set");
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Keypair file not found at: ${keyPath}`);
  }

  const secretKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

// Initialize IDL on startup
loadIDL();
