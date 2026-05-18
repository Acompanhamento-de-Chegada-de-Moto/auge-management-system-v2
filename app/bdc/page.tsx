import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { auth } from "@/lib/auth";
import { bdcGetClientRows } from "@/app/data/bdc/bdc-get-client-rows";
import { ClientsTable } from "./_components/ClientsTable";
import { ClientsTableSkeleton } from "./_components/ClientsTableSkeleton";
import { CreateClientDialog } from "./_components/CreateClientDialog";
import { Uploader } from "./_components/file-uploader/Uploader";
import { SearchInput } from "./_components/SearchInput";
import { BdcClientWrapper } from "./_components/BdcClientWrapper";

export default async function BdcRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const resolved = await searchParams;

  const page = Number(resolved?.page || 1);
  const pageSize = Number(resolved?.pageSize || 10);
  const query = resolved.q?.trim() || undefined;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/bdc/login");
  }

  if (session.user.role !== "BDC") {
    return redirect("/logistics");
  }

  const { totalPages } = await bdcGetClientRows(query, page, pageSize);

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
            <SearchInput />
            <CreateClientDialog />
            <Uploader />
            <LogoutButton />
          </div>
        </div>
      </div>

      <BdcClientWrapper
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
      >
        <Suspense fallback={<ClientsTableSkeleton />}>
          <ClientsTable query={query} page={page} pageSize={pageSize} />
        </Suspense>
      </BdcClientWrapper>
    </div>
  );
}
