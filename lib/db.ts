import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { env } from "./env";

const connectionString = `${env.DATABASE_URL}`;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production";
}

const adapter = new PrismaPg({
  connectionString,
  ssl: getSSLValues(),
});

const prisma = new PrismaClient({ adapter });

export { prisma };
