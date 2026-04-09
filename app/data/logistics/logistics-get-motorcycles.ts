import "server-only";

import { prisma } from "@/lib/db";
import { requireLogistics } from "./require-logistics";

export async function logisticsGetMotorcycles(page = 1, pageSize = 10) {
  await requireLogistics();

  const [data, total] = await Promise.all([
    prisma.motorcycle.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        chassis: true,
        model: true,
        arrivalDate: true,
      },
    }),
    prisma.motorcycle.count(),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
