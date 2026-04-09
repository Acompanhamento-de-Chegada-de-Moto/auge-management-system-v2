"use server";

import { requireLogistics } from "@/data/logistics/require-logistics";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";
import {
  type MotorcycleArrivalSchema,
  motorcycleArrivalSchema,
} from "@/validators/motorcycleArrivalSchema";

export async function RegisterMotorcycleArrival(
  values: MotorcycleArrivalSchema,
): Promise<ApiResponse> {
  const session = await requireLogistics();

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
