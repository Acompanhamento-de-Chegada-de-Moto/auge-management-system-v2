import { z } from "zod";

export const registrationStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
]);

const datePreprocess = (val: unknown) => {
  if (typeof val === "string") {
    const [day, month, year] = val.split("/");

    if (day && month && year) {
      return new Date(`${year}-${month}-${day}`);
    }
  }

  return val;
};

export const clientSchema = z.object({
  client: z.string().trim().min(1, "Cliente é obrigatório"),
  model: z.string().trim().min(1, "Modelo é obrigatório"),
  chassis: z.string().trim().min(1, "Chassi é obrigatório"),
  sellersName: z.string().trim().min(1, "Vendedor é obrigatório"),
  city: z.string().trim().min(1, "Cidade é obrigatória"),

  billingDate: z.preprocess(datePreprocess, z.date()),

  registrationStatus: registrationStatusSchema.optional(),

  registrationStatusDate: z.date().nullable().optional(),
});

export type ClientSchema = z.infer<typeof clientSchema>;
