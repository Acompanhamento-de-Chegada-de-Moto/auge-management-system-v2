import { z } from "zod";

export const motorcycleArrivalSchema = z.object({
  chassis: z.string().length(17).toUpperCase(),
  model: z.string().min(1).trim(),
  arrivalDate: z.preprocess((val) => {
    if (typeof val === "string") {
      const [day, month, year] = val.split("/");
      return new Date(`${year}-${month}-${day}`);
    }
    return val;
  }, z.date()),
});

export type MotorcycleArrivalSchema = z.infer<typeof motorcycleArrivalSchema>;
