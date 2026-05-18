"use server";

import { revalidatePath } from "next/cache";
import { requireLogistics } from "@/app/data/logistics/require-logistics";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/get-client-ip";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse, Motorcycle } from "@/lib/types";
import {
  type MotorcycleArrivalSchema,
  motorcycleArrivalSchema,
} from "@/validators/motorcycleArrivalSchema";
import { logisticsGetMotorcycleByChassis } from "../data/logistics/logistics-get-motorcycle";

type GetMotorcycleByChassisResponse =
  | {
      status: "success";
      data: {
        chassis: string;
        model: string;
        arrivalDate: Date;
      };
    }
  | {
      status: "error";
      message: string;
    };

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
  } catch {
    return {
      status: "error",
      message: "Failed to register a new motorcycle",
    };
  }
}

export async function ImportMotorcycles(
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

    const validation = motorcycleArrivalSchema.array().safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues.slice(0, 3);
      const details = issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join(".") : "";
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join("; ");

      return {
        status: "error",
        message: `Dados da planilha inválidos: ${details}`,
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

    const count = validatedData.length;
    return {
      status: "success",
      message: `${count} ${count === 1 ? "moto importada" : "motos importadas"} com sucesso.`,
    };
  } catch {
    return {
      status: "error",
      message: "Database error while importing motorcycles.",
    };
  }
}

export async function DeleteMotorcycle(chassis: string): Promise<ApiResponse> {
  await requireLogistics();

  try {
    const existingMotorcycle = await logisticsGetMotorcycleByChassis(chassis);

    if (!existingMotorcycle) {
      return {
        status: "error",
        message: "Motorcycle already deleted.",
      };
    }

    await prisma.motorcycle.delete({
      where: {
        id: existingMotorcycle.id,
      },
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: "Motorcycle deleted successfully.",
    };
  } catch {
    return {
      status: "error",
      message: "Error while deleting motorcycle.",
    };
  }
}

export async function EditMotorcycle(
  chassis: string,
  data: MotorcycleArrivalSchema,
): Promise<ApiResponse> {
  await requireLogistics();

  try {
    const existingMotorcycle = await logisticsGetMotorcycleByChassis(chassis);

    if (!existingMotorcycle) {
      return {
        status: "error",
        message: "Motorcycle not found.",
      };
    }

    await prisma.motorcycle.update({
      where: {
        chassis,
      },
      data: {
        chassis: data.chassis,
        model: data.model,
        arrivalDate: data.arrivalDate,
      },
    });

    revalidatePath("/logistics");

    return {
      status: "success",
      message: "Motorcycle updated successfully.",
    };
  } catch {
    return {
      status: "error",
      message: "Error while updating motorcycle.",
    };
  }
}

export async function GetMotorcycleByChassis(
  chassis: string,
): Promise<GetMotorcycleByChassisResponse> {
  try {
    const motorcycle = await logisticsGetMotorcycleByChassis(chassis);

    if (!motorcycle) {
      return {
        status: "error",
        message: "Motorcycle not found.",
      };
    }

    return {
      status: "success",
      data: {
        chassis: motorcycle.chassis,
        model: motorcycle.model,
        arrivalDate: motorcycle.arrivalDate,
      },
    };
  } catch {
    return {
      status: "error",
      message: "Error while fetching motorcycle.",
    };
  }
}
