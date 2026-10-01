import { Schema, model } from "mongoose";

interface IndexerStateDocument {
  key: string;
  lastSignature: string;
  updatedAt: Date;
}

const indexerStateSchema = new Schema<IndexerStateDocument>({
  key: { type: String, required: true, unique: true },
  lastSignature: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const IndexerState = model<IndexerStateDocument>("IndexerState", indexerStateSchema);