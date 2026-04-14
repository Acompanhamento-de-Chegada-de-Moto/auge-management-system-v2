"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";
import { type LoginInputType, loginSchema } from "@/lib/zodSchemas";
export function LoginForm() {
  const [emailAndPasswordPending, startEmailAndPasswordTransition] =
    useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInputType) => {
    startEmailAndPasswordTransition(async () => {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/bdc`,
      });
    });
  };

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <CardTitle>Acesso ao painel logístico</CardTitle>
          <CardDescription>
            Digite a senha para acessar o painel de logística
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Input {...register("email")} type="email" placeholder="Email" />
              {errors && (
                <p className="text-xs text-red-600">{errors.email?.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Input
                {...register("password")}
                type="password"
                placeholder="Senha de acesso"
                autoComplete="current-password"
              />
              {errors && (
                <p className="text-xs text-red-600">
                  {errors.password?.message}
                </p>
              )}
            </div>
            <Button className="w-full cursor-pointer" type="submit">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
