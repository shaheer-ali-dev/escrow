import type { NextFunction, Request, Response } from "express";
export function notFoundHandler(_req: Request, res: Response) { res.status(404).json({ error: "Route not found" }); }
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
