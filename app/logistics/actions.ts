"use server";

import { revalidatePath } from "next/cache";
import { requireLogistics } from "@/app/data/logistics/require-logistics";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";
import {
  type MotorcycleArrivalSchema,
  motorcycleArrivalSchema,
} from "@/validators/motorcycleArrivalSchema";

export async function RegisterMotorcycleArrival(
  values: MotorcycleArrivalSchema,
): Promise<ApiResponse> {
  await requireLogistics();

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
      },
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to register a new motorcycle",
    };
  }
}

export async function importMotorcycles(
  data: MotorcycleArrivalSchema[],
): Promise<ApiResponse> {
  await requireLogistics();

  try {
    if (!data.length) {
      return {
        status: "error",
        message: "No data provided.",
      };
    }

    await prisma.motorcycle.createMany({
      data: data.map((item) => ({
        chassis: item.chassis,
        model: item.model,
        arrivalDate: new Date(item.arrivalDate),
      })),
      skipDuplicates: true,
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: `${data.length} motorcycles imported successfully.`,
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message: "Database error while importing motorcycles.",
    };
  }
}
