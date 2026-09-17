import { z } from "zod";
import type { Request, Response } from "express";
import { Profile } from "../models/profile.model.js";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
const walletSchema = z.object({ walletAddress: z.string(), message: z.string().min(1), signatureBase64: z.string().min(1) });
export async function verifyWallet(req: Request, res: Response) { const input = walletSchema.parse(req.body); const address = new PublicKey(input.walletAddress); const verified = nacl.sign.detached.verify(Buffer.from(input.message), Buffer.from(input.signatureBase64, "base64"), address.toBytes()); if (!verified) return res.status(400).json({ error: "Invalid wallet signature" }); const profile = await Profile.findOneAndUpdate({ userId: req.auth!.userId }, { walletAddress: address.toBase58(), walletVerifiedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true }); return res.json({ profile, walletVerified: true }); }
