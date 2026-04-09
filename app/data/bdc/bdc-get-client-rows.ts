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
};

export async function bdcGetClientRows(): Promise<BdcClientTableRow[]> {
  await requireBdc();

  const motorcycles = await prisma.motorcycle.findMany({
    where: { clientId: { not: null } },
    orderBy: { updatedAt: "desc" },
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
    };
  });
}
