import type { Request, Response } from "express";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Profile } from "../models/profile.model.js";

const walletSchema = z.object({
  walletAddress: z.string(),
  message: z.string().min(1),
  signatureBase64: z.string().min(1),
});

export async function verifyWallet(req: Request, res: Response) {
  const payload = walletSchema.parse(req.body);
  const publicKey = new PublicKey(payload.walletAddress);

  const isValid = nacl.sign.detached.verify(
    Buffer.from(payload.message),
    Buffer.from(payload.signatureBase64, "base64"),
    publicKey.toBytes()
  );

  if (!isValid) {
    return res.status(400).json({ error: "Invalid wallet signature" });
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.auth!.userId },
    { walletAddress: publicKey.toBase58(), walletVerifiedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ profile, walletVerified: true });
}
