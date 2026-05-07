import { z } from "zod";

export const motorcycleArrivalSchema = z.object({
  chassis: z
    .string()
    .length(17, "Chassi deve ter 17 caracteres")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Chassi inválido")
    .toUpperCase(),
  model: z
    .string()
    .min(1, "Modelo é obrigatório")
    .trim()
    .max(200, "Máximo 200 caracteres"),
  arrivalDate: z.preprocess((val) => {
    if (typeof val === "string") {
      const [day, month, year] = val.split("/");
      return new Date(`${year}-${month}-${day}`);
    }
    return val;
  }, z.date()),
});

export type MotorcycleArrivalSchema = z.infer<typeof motorcycleArrivalSchema>;
