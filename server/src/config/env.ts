import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  BLOCKSUB_PROGRAM_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().default("http://localhost:4000/api/auth/google/callback"),
});

export const env = envSchema.parse(process.env);
