import type { Request, Response } from "express";
import { z } from "zod";
import {
  searchFreelancers,
  getFreelancerByWallet,
  getTopFreelancers,
  updateFreelancerProfile,
  createFreelancerProfile,
} from "../services/freelancer-search.service.js";

const searchSchema = z.object({
  skills: z.array(z.string()).optional(),
  minRating: z.coerce.number().min(0).max(5).default(0),
  maxRate: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  profileImage: z.string().url().optional(),
  portfolio: z.array(z.string().url()).optional(),
});

export async function searchFreelancersEndpoint(req: Request, res: Response) {
  try {
    const { skills, minRating, maxRate, limit, skip } = searchSchema.parse(req.query);

    const freelancers = await searchFreelancers(skills, minRating, maxRate, limit, skip);
    return res.json(freelancers);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getTopFreelancersEndpoint(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const freelancers = await getTopFreelancers(limit);
    return res.json(freelancers);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getFreelancerProfileEndpoint(req: Request, res: Response) {
  try {
    const { walletAddress } = req.params;
    const freelancer = await getFreelancerByWallet(walletAddress);

    if (!freelancer) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    return res.json(freelancer);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function updateFreelancerProfileEndpoint(req: Request, res: Response) {
  try {
    const userId = req.auth!.userId;
    const data = updateProfileSchema.parse(req.body);

    const updated = await updateFreelancerProfile(userId, data);
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function createFreelancerProfileEndpoint(req: Request, res: Response) {
  try {
    const userId = req.auth!.userId;
    const { name, skills } = z
      .object({
        name: z.string().min(1),
        skills: z.array(z.string()).default([]),
      })
      .parse(req.body);

    const freelancer = await createFreelancerProfile(userId, name, skills);
    return res.status(201).json(freelancer);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}