"use server";

import { revalidatePath } from "next/cache";
import { RegistrationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/get-client-ip";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/lib/types";
import type { ClientSchema } from "@/validators/clientSchema";
import { clientSchema } from "@/validators/clientSchema";
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
  arrivalDate: string | null | undefined;
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
  arrivalDate: string | null | undefined;
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

function parseRequiredDate(
  value: string | Date | null | undefined,
): Date | undefined {
  const result = parseOptionalDate(value);
  return result ?? undefined;
}

function validateRegistrationDate(
  status: RegistrationStatus,
  registrationStatusDate: string | null | undefined,
): ApiResponse | null {
  if (shouldTrackRegistrationDate(status) && !registrationStatusDate) {
    const messageError =
      status === RegistrationStatus.IN_PROGRESS
        ? "Preencha a data de saída para emplacamento."
        : "Preencha a data de emplacamento.";

    return {
      status: "error",
      message: messageError,
    };
  }

  return null;
}

export async function createClient(
  input: CreateClientInput,
): Promise<ApiResponse> {
  await requireBdc();

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `bdc:create:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return {
      status: "error",
      message: "Muitas requisições. Aguarde um momento.",
    };
  }

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

      const arrivalDate = parseRequiredDate(input.arrivalDate);

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
          ...(arrivalDate ? { arrivalDate } : {}),
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

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `bdc:unlink:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return {
      status: "error",
      message: "Muitas requisições. Aguarde um momento.",
    };
  }

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

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `bdc:update:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return {
      status: "error",
      message: "Muitas requisições. Aguarde um momento.",
    };
  }

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
      const moto = await tx.motorcycle.findUnique({
        where: { id: input.motorcycleId },
        select: { clientId: true },
      });

      if (!moto || moto.clientId !== input.clientId) {
        throw new Error("UNAUTHORIZED_MOTORCYCLE");
      }

      await tx.client.update({
        where: { id: input.clientId },
        data: {
          name,
          sellerName,
          city,
          billingDate: parseOptionalDate(input.billingDate),
        },
      });

      const arrivalDate = parseRequiredDate(input.arrivalDate);

      await tx.motorcycle.update({
        where: { id: input.motorcycleId },
        data: {
          registrationStatus: input.registrationStatus,
          registrationStatusDate: shouldTrackRegistrationDate(
            input.registrationStatus,
          )
            ? parseOptionalDate(input.registrationStatusDate)
            : null,
          ...(arrivalDate ? { arrivalDate } : {}),
        },
      });
    });

    revalidatePath("/bdc");

    return {
      status: "success",
      message: "Cliente atualizado com sucesso.",
    };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED_MOTORCYCLE") {
      return {
        status: "error",
        message: "Moto não autorizada para este cliente.",
      };
    }

    return {
      status: "error",
      message: "Erro ao atualizar cliente.",
    };
  }
}

export async function FetchMotorcycleByChassis(chassis: string) {
  await requireBdc();

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `bdc:fetch-moto:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return {
      status: "error",
      message: "Muitas requisições. Aguarde um momento.",
    };
  }

  const data = await bdcGetMotorcycle({ chassis });

  if (!data) {
    return {
      status: "error",
      message: "Moto não encontrada, verifique o chassi na logística.",
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

  const ip = await getClientIp();
  const limit = rateLimit({
    identifier: `bdc:import:${ip}`,
    limit: 10000,
    windowMs: 60_000,
  });
  if (!limit.success) {
    return {
      status: "error",
      message: "Muitas requisições. Aguarde um momento.",
    };
  }

  try {
    if (!data.length) {
      return {
        status: "error",
        message: "Nenhum dado fornecido.",
      };
    }

    const validation = clientSchema.array().safeParse(data);
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
    const chassisList = validatedData.map((item) => item.chassis);

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

    const motorcycleIdByChassis = new Map(
      motorcycles.map((motorcycle) => [motorcycle.chassis, motorcycle.id]),
    );

    const validRows = validatedData.filter((item) =>
      motorcycleIdByChassis.has(item.chassis),
    );

    const ignoredCount = validatedData.length - validRows.length;

    if (!validRows.length) {
      revalidatePath("/bdc");
      return {
        status: "success",
        message: `0 clientes importados. ${ignoredCount} ${ignoredCount === 1 ? "registro foi ignorado" : "registros foram ignorados"} (chassi não encontrado na logística).`,
      };
    }

    // Cria todos os clients de uma vez (muito mais rápido no Neon)
    const clientData = validRows.map((row) => ({
      name: row.client,
      sellerName: row.sellersName,
      city: row.city,
      billingDate: parseOptionalDate(row.billingDate),
    }));

    let createdClients: { id: string }[] = [];
    let importedCount = 0;
    let failedCount = 0;

    try {
      createdClients = await prisma.client.createManyAndReturn({
        data: clientData,
      });
    } catch {
      return {
        status: "error",
        message: "Erro ao criar clientes em lote.",
      };
    }

    // Atualiza as motos em paralelo (vincula clientId)
    const updatePromises = validRows.map((row, index) => {
      const motorcycleId = motorcycleIdByChassis.get(row.chassis);
      const client = createdClients[index];

      if (!motorcycleId || !client) {
        failedCount++;
        return Promise.resolve();
      }

      const status = row.registrationStatus ?? RegistrationStatus.PENDING;

      return prisma.motorcycle
        .update({
          where: { id: motorcycleId },
          data: {
            clientId: client.id,
            model: row.model,
            registrationStatus: status,
            registrationStatusDate: shouldTrackRegistrationDate(status)
              ? parseOptionalDate(row.registrationStatusDate)
              : null,
          },
        })
        .then(() => {
          importedCount++;
        })
        .catch(() => {
          failedCount++;
        });
    });

    await Promise.all(updatePromises);

    revalidatePath("/bdc");

    let message = `${importedCount} ${importedCount === 1 ? "cliente importado" : "clientes importados"} com sucesso.`;
    if (ignoredCount > 0) {
      message += ` ${ignoredCount} ${ignoredCount === 1 ? "registro foi ignorado" : "registros foram ignorados"} (chassi não encontrado na logística).`;
    }
    if (failedCount > 0) {
      message += ` ${failedCount} ${failedCount === 1 ? "registro falhou" : "registros falharam"} no banco.`;
    }

    return {
      status: "success",
      message,
    };
  } catch {
    return {
      status: "error",
      message: "Erro no banco ao importar clientes.",
    };
  }
}
