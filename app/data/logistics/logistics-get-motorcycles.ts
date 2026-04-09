import "server-only";
import { prisma } from "@/lib/db";
import { requireLogistics } from "./require-logistics";

export async function logisticsGetMotorcycles() {
  await requireLogistics();

  const data = prisma.motorcycle.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      chassis: true,
      model: true,
      arrivalDate: true,
    },
  });

  return data;
}
