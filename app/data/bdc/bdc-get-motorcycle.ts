import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireBdc } from "./require-bdc";

export async function bdcGetMotorcycle({ chassis }: { chassis: string }) {
  await requireBdc();

  const data = await prisma.motorcycle.findFirst({
    where: {
      chassis: chassis,
    },
    select: {
      id: true,
      chassis: true,
      model: true,
      arrivalDate: true,
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}
