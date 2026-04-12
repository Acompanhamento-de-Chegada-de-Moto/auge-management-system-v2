import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

const connectionString = env.DATABASE_URL;

function getAdapterConfig() {
  if (process.env.POSTGRES_CA) {
    return {
      ssl: {
        ca: process.env.POSTGRES_CA,
      },
    };
  }

  // Let the driver honor the sslmode embedded in DATABASE_URL.
  return {};
}

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString,
    ...getAdapterConfig(),
  });
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
