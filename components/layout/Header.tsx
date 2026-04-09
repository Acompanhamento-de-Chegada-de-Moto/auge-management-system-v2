"use client";

import { Bike } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Badge } from "../ui/badge";

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b border-border bg-card">
      <div className="flex justify-between w-full mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Bike className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight text-balance">
              Acompanhamento de Chegada de Moto
            </h1>
            <p className="text-xs text-muted-foreground">
              Controle de chegada e status de motos da concessionaria
            </p>
          </div>
        </div>
        <div>{session?.user.name && <Badge>{session?.user.name}</Badge>}</div>
      </div>
    </header>
  );
}
