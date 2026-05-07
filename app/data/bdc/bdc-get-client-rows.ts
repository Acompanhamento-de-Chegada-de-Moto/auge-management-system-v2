import "server-only";

import { prisma } from "@/lib/db";
import { requireBdc } from "./require-bdc";

export type BdcClientTableRow = {
  motorcycleId: string;
  clientId: string;
  clientName: string;
  sellerName: string;
  city: string;
  model: string;
  chassis: string;
  billingDate: Date | null;
  arrivalDate: Date;
  registrationStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  registrationStatusDate: Date | null;
};

export async function bdcGetClientRows(
  query?: string,
): Promise<BdcClientTableRow[]> {
  await requireBdc();

  const safeQuery = query && query.length > 100 ? query.slice(0, 100) : query;

  const motorcycles = await prisma.motorcycle.findMany({
    where: {
      clientId: { not: null },
      ...(safeQuery && {
        OR: [
          {
            chassis: {
              contains: safeQuery,
              mode: "insensitive",
            },
          },
          {
            client: {
              name: {
                contains: safeQuery,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      client: true,
    },
  });

  return motorcycles.map((m) => {
    const client = m.client;
    if (!client) {
      throw new Error("Invariant: motorcycle has clientId but no client");
    }

    return {
      motorcycleId: m.id,
      clientId: client.id,
      clientName: client.name,
      sellerName: client.sellerName,
      city: client.city,
      model: m.model,
      chassis: m.chassis,
      billingDate: client.billingDate,
      arrivalDate: m.arrivalDate,
      registrationStatus: m.registrationStatus,
      registrationStatusDate: m.registrationStatusDate,
    };
  });
}

export type PublicClientStatusRow = {
  motorcycleId: string;
  clientName: string;
  model: string;
  chassis: string;
  arrivalDate: Date;
  registrationStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  registrationStatusDate: Date | null;
};

export async function publicGetClientStatus(
  query: string,
): Promise<PublicClientStatusRow[]> {
  if (!query || query.length < 3 || query.length > 100) {
    return [];
  }

  const motorcycles = await prisma.motorcycle.findMany({
    where: {
      clientId: { not: null },
      OR: [
        {
          client: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
        {
          chassis: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  return motorcycles.map((m) => {
    const client = m.client;
    if (!client) {
      throw new Error("Invariant: motorcycle has clientId but no client");
    }

    return {
      motorcycleId: m.id,
      clientName: client.name,
      model: m.model,
      chassis: maskChassis(m.chassis),
      arrivalDate: m.arrivalDate,
      registrationStatus: m.registrationStatus,
      registrationStatusDate: m.registrationStatusDate,
    };
  });
}

export function maskChassis(chassis: string): string {
  if (!chassis) return "";

  const visible = chassis.slice(-6);
  const masked = "*".repeat(Math.max(0, chassis.length - 6));

  return masked + visible;
}
