import { z } from "zod";

export const registrationStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
]);

const datePreprocess = (val: unknown) => {
  if (val === null || val === undefined || val === "") return undefined;

  if (val instanceof Date) return val;

  if (typeof val === "string") {
    const [day, month, year] = val.split("/");

    if (day && month && year) {
      return new Date(`${year}-${month}-${day}`);
    }
  }

  const parsed = new Date(String(val));
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed;
};

export const clientSchema = z.object({
  client: z
    .string()
    .trim()
    .min(1, "Cliente é obrigatório")
    .max(200, "Máximo 200 caracteres"),
  model: z
    .string()
    .trim()
    .min(1, "Modelo é obrigatório")
    .max(200, "Máximo 200 caracteres"),
  chassis: z
    .string()
    .trim()
    .min(1, "Chassi é obrigatório")
    .length(17, "Chassi deve ter 17 caracteres")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Chassi inválido"),
  sellersName: z
    .string()
    .trim()
    .min(1, "Vendedor é obrigatório")
    .max(200, "Máximo 200 caracteres"),
  city: z
    .string()
    .trim()
    .min(1, "Cidade é obrigatória")
    .max(100, "Máximo 100 caracteres"),

  billingDate: z.preprocess(datePreprocess, z.date().optional()).optional(),
  registrationStatus: registrationStatusSchema.optional(),
  registrationStatusDate: z.date().nullable().optional(),
  arrivalDate: z.date().optional(),
});

export type ClientSchema = z.infer<typeof clientSchema>;
