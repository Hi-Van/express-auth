import { Request, Response } from "express";
import { Session } from "lucia";

export interface RegisterRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

export interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

