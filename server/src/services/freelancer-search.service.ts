import { FreelancerProfile } from "../models/freelancer-profile.model.js";

export async function searchFreelancers(
  skills?: string[],
  minRating: number = 0,
  maxRate?: number,
  limit = 20,
  skip = 0
) {
  const query: any = { status: "active" };

  if (skills && skills.length > 0) {
    query.skills = { $in: skills };
  }

  if (minRating > 0) {
    query.averageRating = { $gte: minRating };
  }

  if (maxRate) {
    query.hourlyRate = { $lte: maxRate };
  }

  return FreelancerProfile.find(query)
    .sort({ averageRating: -1, completedMilestones: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
}

export async function getFreelancerByWallet(walletAddress: string) {
  return FreelancerProfile.findOne({ walletAddress }).lean();
}

export async function updateFreelancerProfile(
  walletAddress: string,
  updates: Partial<any>
) {
  return FreelancerProfile.findOneAndUpdate(
    { walletAddress },
    updates,
    { new: true }
  );
}

export async function createFreelancerProfile(
  walletAddress: string,
  name: string,
  skills: string[] = []
) {
  return FreelancerProfile.create({
    walletAddress,
    name,
    skills,
  });
}

export async function getTopFreelancers(limit = 10) {
  return FreelancerProfile.find({ status: "active" })
    .sort({ averageRating: -1, completedMilestones: -1 })
    .limit(limit)
    .lean();
}