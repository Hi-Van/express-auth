import { Request, Response } from "express";

export interface LoginRequest extends Request {
  body: {
    username: string;
    email?: string;
    password: string;
  };
}