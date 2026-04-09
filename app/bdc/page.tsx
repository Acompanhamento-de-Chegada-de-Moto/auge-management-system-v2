import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { auth } from "@/lib/auth";
import { ClientsTable } from "./_components/ClientsTable";
import { ClientsTableSkeleton } from "./_components/ClientsTableSkeleton";
import { CreateClientForm } from "./_components/CreateClientForm";

export default async function BdcRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/bdc/login");
  }

  if (session.user.role !== "BDC") {
    return redirect("/logistics");
  }

  return (
    <div className="w-full mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Painel BDC - Clientes
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie o status de emplacamento e entrega.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CreateClientForm />

            <LogoutButton />
          </div>
        </div>
      </div>

      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTable />
      </Suspense>
    </div>
  );
}
