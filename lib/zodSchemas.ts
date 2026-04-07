import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha precisa ter no mínimo 6 caracteres"),
});

export type LoginInputType = z.infer<typeof loginSchema>;
