"use server";

import { revalidatePath } from "next/cache";
import { requireLogistics } from "@/app/data/logistics/require-logistics";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/get-client-ip";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/lib/types";
import {
  type MotorcycleArrivalSchema,
  motorcycleArrivalSchema,
} from "@/validators/motorcycleArrivalSchema";

function parseSafeDate(date: string | Date): Date {
  if (date instanceof Date) return date;

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day, 12, 0, 0);
}

export async function RegisterMotorcycleArrival(
  values: MotorcycleArrivalSchema,
): Promise<ApiResponse> {
  await requireLogistics();

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `logistics:register:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return { status: "error", message: "Too many requests. Please slow down." };
  }

  try {
    const validation = motorcycleArrivalSchema.safeParse(values);

    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid form data",
      };
    }

    await prisma.motorcycle.create({
      data: {
        ...validation.data,
        arrivalDate: parseSafeDate(validation.data.arrivalDate),
      },
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: "Motorcycle created successfully",
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message: "Failed to register a new motorcycle",
    };
  }
}

const IMPORT_BATCH_LIMIT = 500;

export async function importMotorcycles(
  data: MotorcycleArrivalSchema[],
): Promise<ApiResponse> {
  await requireLogistics();

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `logistics:import:${ip}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return { status: "error", message: "Too many requests. Please slow down." };
  }

  try {
    if (!data.length) {
      return {
        status: "error",
        message: "No data provided.",
      };
    }

    if (data.length > IMPORT_BATCH_LIMIT) {
      return {
        status: "error",
        message: `Import limit of ${IMPORT_BATCH_LIMIT} records exceeded.`,
      };
    }

    const validation = motorcycleArrivalSchema.array().safeParse(data);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid spreadsheet data. Check chassis format and dates.",
      };
    }

    const validatedData = validation.data;

    await prisma.motorcycle.createMany({
      data: validatedData.map((item) => ({
        chassis: item.chassis,
        model: item.model,
        arrivalDate: parseSafeDate(item.arrivalDate),
      })),
      skipDuplicates: true,
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: `${validatedData.length} motorcycles imported successfully.`,
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message: "Database error while importing motorcycles.",
    };
  }
}
