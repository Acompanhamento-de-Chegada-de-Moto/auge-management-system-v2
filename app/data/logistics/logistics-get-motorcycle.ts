import "server-only";

import { prisma } from "@/lib/db";
import { requireLogistics } from "./require-logistics";

export async function logisticsGetMotorcycleByChassis(chassis: string) {
  await requireLogistics();

  const motorcycle = await prisma.motorcycle.findUnique({
    where: {
      chassis: chassis,
    },
  });

  return motorcycle;
}
