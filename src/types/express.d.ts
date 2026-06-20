import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: "student" | "vendor" | "admin";
    }
  }
}

export {};