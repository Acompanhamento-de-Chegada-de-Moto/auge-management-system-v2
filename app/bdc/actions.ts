"use server";

import { revalidatePath } from "next/cache";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/lib/types";
import type { ClientSchema } from "@/validators/clientSchema";
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

function shouldTrackRegistrationDate(status: RegistrationStatus): boolean {
  return (
    status === RegistrationStatus.IN_PROGRESS ||
    status === RegistrationStatus.COMPLETED
  );
}

/**
 * Corrige bug de timezone criando a data no horário local (12:00)
 * para evitar mudança de dia ao salvar em UTC.
 */
function parseOptionalDate(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;

  // Se já veio como Date
  if (value instanceof Date) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      12,
      0,
      0,
    );
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
  );
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
    return { status: "error", message: "Moto não selecionada." };
  }

  const validStatuses = new Set(Object.values(RegistrationStatus));
  if (!validStatuses.has(input.registrationStatus)) {
    return {
      status: "error",
      message: "Situação de emplacamento inválida.",
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

    return {
      status: "success",
      message: "Cliente criado com sucesso.",
    };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MOTOR_NOT_FOUND") {
        return { status: "error", message: "Moto não encontrada." };
      }

      if (err.message === "MOTOR_ALREADY_LINKED") {
        return {
          status: "error",
          message: "Esta moto já está vinculada a um cliente.",
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
    return { status: "error", message: "Moto inválida." };
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
        await tx.client.delete({
          where: { id: clientId },
        });
      }
    });

    revalidatePath("/bdc");

    return {
      status: "success",
      message: "Vínculo removido.",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_LINKED") {
      return {
        status: "error",
        message: "Esta moto não está vinculada.",
      };
    }

    return {
      status: "error",
      message: "Erro ao remover vínculo.",
    };
  }
}

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

    return {
      status: "success",
      message: "Cliente atualizado com sucesso.",
    };
  } catch (err) {
    console.error(err);

    return {
      status: "error",
      message: "Erro ao atualizar cliente.",
    };
  }
}

export async function getMotorcycleByChassis(chassis: string) {
  await requireBdc();

  const data = await bdcGetMotorcycle({ chassis });

  if (!data) {
    return {
      status: "error",
      message: "Moto não encontrada",
    };
  }

  return {
    status: "success",
    message: "Moto encontrada com sucesso",
    data,
  };
}

export async function importClients(
  data: ClientSchema[],
): Promise<ApiResponse> {
  await requireBdc();

  try {
    if (!data.length) {
      return {
        status: "error",
        message: "Nenhum dado fornecido.",
      };
    }

    const chassisList = data.map((item) => item.chassis);

    const motorcycles = await prisma.motorcycle.findMany({
      where: {
        chassis: {
          in: chassisList,
        },
      },
      select: {
        id: true,
        chassis: true,
      },
    });

    if (!motorcycles.length) {
      return {
        status: "error",
        message: "Nenhuma moto correspondente encontrada.",
      };
    }

    const motorcycleIdByChassis = new Map(
      motorcycles.map((motorcycle) => [motorcycle.chassis, motorcycle.id]),
    );

    const validRows = data.filter((item) =>
      motorcycleIdByChassis.has(item.chassis),
    );

    if (!validRows.length) {
      return {
        status: "error",
        message: "Nenhuma linha válida encontrada para importação.",
      };
    }

    const createdClients = await prisma.$transaction(
      validRows.map((item) =>
        prisma.client.create({
          data: {
            name: item.client,
            sellerName: item.sellersName,
            city: item.city,
            billingDate: parseOptionalDate(item.billingDate),
          },
        }),
      ),
    );

    await prisma.$transaction(
      createdClients.map((client, index) => {
        const row = validRows[index];
        const motorcycleId = motorcycleIdByChassis.get(row.chassis);

        if (!motorcycleId) {
          throw new Error(`Moto não encontrada para o chassi ${row.chassis}`);
        }

        const status = row.registrationStatus ?? RegistrationStatus.PENDING;

        return prisma.motorcycle.update({
          where: {
            id: motorcycleId,
          },
          data: {
            clientId: client.id,
            model: row.model,
            registrationStatus: status,
            registrationStatusDate: shouldTrackRegistrationDate(status)
              ? parseOptionalDate(row.registrationStatusDate)
              : null,
          },
        });
      }),
    );

    revalidatePath("/bdc");

    return {
      status: "success",
      message: `${createdClients.length} clientes importados com sucesso.`,
    };
  } catch (error) {
    console.error("Import clients error:", error);

    return {
      status: "error",
      message: "Erro no banco ao importar clientes.",
    };
  }
}
