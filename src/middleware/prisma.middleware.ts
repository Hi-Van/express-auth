import { PrismaClient, Prisma } from "@prisma/client";

interface User {
  id: string;
  username: string;
  email: string;
  hashed_password: string;
}

class PrismaService {
  private static instance: PrismaService;
  private client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient();
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }

    return PrismaService.instance;
  }

  public adapt(): [Prisma.SessionDelegate, Prisma.UserDelegate] {
    return [this.client.session, this.client.user];
  }

  public async createUser(
    id: string,
    username: string,
    email: string,
    hashedPassword: string
  ): Promise<User> {
    return await this.client.user.create({
      data: { id, username, email, hashed_password: hashedPassword }, // Fix: Updated property name 'hashed_password' to 'hashedPassword'
    });
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    return await this.client.user.findFirst({ where: { username } });
  }
}

export const prisma = PrismaService.getInstance();
