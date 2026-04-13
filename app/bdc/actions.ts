"use server";

import { revalidatePath } from "next/cache";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";
import { bdcGetMotorcycle } from "../data/bdc/bdc-get-motorcycle";
import { requireBdc } from "../data/bdc/require-bdc";

export type CreateClientInput = {
  name: string;
  sellerName: string;
  city: string;
  billingDate: string | null | undefined;
  motorcycleId: string;
  registrationStatus: RegistrationStatus;
  registrationStatusDate: string | null | undefined;
};

function shouldTrackRegistrationDate(status: RegistrationStatus): boolean {
  return (
    status === RegistrationStatus.IN_PROGRESS ||
    status === RegistrationStatus.COMPLETED
  );
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  return value && value.length > 0 ? new Date(`${value}T12:00:00`) : null;
}

function validateRegistrationDate(
  status: RegistrationStatus,
  registrationStatusDate: string | null | undefined,
): ApiResponse | null {
  if (shouldTrackRegistrationDate(status) && !registrationStatusDate) {
    return {
      status: "error",
      message: "Preencha a data do emplacamento para o status selecionado.",
    };
  }

  return null;
}

export async function createClient(
  input: CreateClientInput,
): Promise<ApiResponse> {
  await requireBdc();

  const name = input.name.trim();
  const sellerName = input.sellerName.trim();
  const city = input.city.trim();

  if (!name || !sellerName || !city) {
    return {
      status: "error",
      message: "Preencha cliente, vendedor e cidade.",
    };
  }

  if (!input.motorcycleId) {
    return { status: "error", message: "Moto n�o selecionada." };
  }

  const validStatuses = new Set<string>(Object.values(RegistrationStatus));
  if (!validStatuses.has(input.registrationStatus)) {
    return {
      status: "error",
      message: "Situa��o de emplacamento inv�lida.",
    };
  }

  const registrationDateError = validateRegistrationDate(
    input.registrationStatus,
    input.registrationStatusDate,
  );

  if (registrationDateError) {
    return registrationDateError;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const moto = await tx.motorcycle.findUnique({
        where: { id: input.motorcycleId },
      });

      if (!moto) {
        throw new Error("MOTOR_NOT_FOUND");
      }
      if (moto.clientId) {
        throw new Error("MOTOR_ALREADY_LINKED");
      }

      const client = await tx.client.create({
        data: {
          name,
          sellerName,
          city,
          billingDate: parseOptionalDate(input.billingDate),
        },
      });

      await tx.motorcycle.update({
        where: { id: input.motorcycleId },
        data: {
          clientId: client.id,
          registrationStatus: input.registrationStatus,
          registrationStatusDate: shouldTrackRegistrationDate(
            input.registrationStatus,
          )
            ? parseOptionalDate(input.registrationStatusDate)
            : null,
        },
      });
    });

    revalidatePath("/bdc");

    return { status: "success", message: "Cliente criado com sucesso." };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MOTOR_NOT_FOUND") {
        return { status: "error", message: "Moto n�o encontrada." };
      }
      if (err.message === "MOTOR_ALREADY_LINKED") {
        return {
          status: "error",
          message: "Esta moto j� est� vinculada a um cliente.",
        };
      }
    }

    return { status: "error", message: "Erro ao criar cliente." };
  }
}

export async function unlinkClientMotorcycle(
  motorcycleId: string,
): Promise<ApiResponse> {
  await requireBdc();

  if (!motorcycleId) {
    return { status: "error", message: "Moto inv�lida." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const moto = await tx.motorcycle.findUnique({
        where: { id: motorcycleId },
      });

      if (!moto?.clientId) {
        throw new Error("NOT_LINKED");
      }

      const clientId = moto.clientId;

      await tx.motorcycle.update({
        where: { id: motorcycleId },
        data: {
          clientId: null,
          registrationStatus: RegistrationStatus.PENDING,
          registrationStatusDate: null,
        },
      });

      const remaining = await tx.motorcycle.count({
        where: { clientId },
      });

      if (remaining === 0) {
        await tx.client.delete({ where: { id: clientId } });
      }
    });

    revalidatePath("/bdc");

    return { status: "success", message: "V�nculo removido." };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_LINKED") {
      return { status: "error", message: "Esta moto n�o est� vinculada." };
    }

    return { status: "error", message: "Erro ao remover v�nculo." };
  }
}

export type UpdateClientInput = {
  clientId: string;
  name: string;
  sellerName: string;
  city: string;
  billingDate: string | null | undefined;
  motorcycleId: string;
  registrationStatus: RegistrationStatus;
  registrationStatusDate: string | null | undefined;
};

export async function updateClient(
  input: UpdateClientInput,
): Promise<ApiResponse> {
  await requireBdc();

  const name = input.name.trim();
  const sellerName = input.sellerName.trim();
  const city = input.city.trim();

  if (!name || !sellerName || !city) {
    return {
      status: "error",
      message: "Preencha cliente, vendedor e cidade.",
    };
  }

  const registrationDateError = validateRegistrationDate(
    input.registrationStatus,
    input.registrationStatusDate,
  );

  if (registrationDateError) {
    return registrationDateError;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: input.clientId },
        data: {
          name,
          sellerName,
          city,
          billingDate: parseOptionalDate(input.billingDate),
        },
      });

      await tx.motorcycle.update({
        where: { id: input.motorcycleId },
        data: {
          registrationStatus: input.registrationStatus,
          registrationStatusDate: shouldTrackRegistrationDate(
            input.registrationStatus,
          )
            ? parseOptionalDate(input.registrationStatusDate)
            : null,
        },
      });
    });

    revalidatePath("/bdc");

    return { status: "success", message: "Cliente atualizado com sucesso." };
  } catch (err) {
    console.error(err);
    return { status: "error", message: "Erro ao atualizar cliente." };
  }
}

export async function getMotorcycleByChassis(chassis: string) {
  await requireBdc();

  const data = await bdcGetMotorcycle({ chassis });

  if (!data) {
    return {
      status: "error",
      message: "Moto n�o encontrada",
    };
  }

  return {
    status: "success",
    message: "Moto encontrada com sucesso",
    data,
  };
}
