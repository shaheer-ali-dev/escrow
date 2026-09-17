import mongoose, { Schema } from "mongoose";
export interface ProfileDoc { userId: mongoose.Types.ObjectId; walletAddress?: string; walletVerifiedAt?: Date; bio?: string; skills: string[]; portfolioUrls: string[]; }
const schema = new Schema<ProfileDoc>({ userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true, index: true }, walletAddress: { type: String, index: true }, walletVerifiedAt: Date, bio: { type: String, maxlength: 2000 }, skills: { type: [String], default: [] }, portfolioUrls: { type: [String], default: [] } }, { timestamps: true });
export const Profile = mongoose.model<ProfileDoc>("Profile", schema);
