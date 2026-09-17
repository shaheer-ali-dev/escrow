import mongoose, { Schema } from "mongoose";
export type ChainEventType = "escrow_created" | "milestone_created" | "milestone_released" | "escrow_cancelled";
export interface ChainEventDoc { signature: string; type: ChainEventType; escrowAddress?: string; walletAddresses: string[]; amountLamports?: string; slot?: number; blockTime?: Date; raw?: unknown; }
const schema = new Schema<ChainEventDoc>({ signature: { type: String, unique: true, required: true }, type: { type: String, enum: ["escrow_created", "milestone_created", "milestone_released", "escrow_cancelled"], required: true, index: true }, escrowAddress: { type: String, index: true }, walletAddresses: { type: [String], default: [] }, amountLamports: String, slot: Number, blockTime: Date, raw: Schema.Types.Mixed }, { timestamps: true });
export const ChainEvent = mongoose.model<ChainEventDoc>("ChainEvent", schema);
