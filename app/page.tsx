import { publicGetClientStatus } from "@/app/data/bdc/bdc-get-client-rows";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";
import { ClientSearchInput } from "./_components/ClientSearchInput";
import { ClientStatusCard } from "./_components/ClientStatusCard";

export default async function Home(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.search || "";
  const results = await publicGetClientStatus(query);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 md:py-20">
      <main className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Consultar Status da Moto
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Pesquise pelo nome do cliente ou numero do chassi
          </p>
        </div>

        <ClientSearchInput />

        <div className="mt-4 flex flex-col gap-6">
          {query.length > 0 && query.length < 3 && (
            <p className="text-sm text-zinc-500">
              Digite pelo menos 3 caracteres para pesquisar...
            </p>
          )}

          {query.length >= 3 && results.length === 0 && (
            <div className="p-8 border-2 border-dashed border-zinc-200 rounded-xl text-center">
              <p className="text-zinc-500">
                Nenhum resultado encontrado para &quot;{query}&quot;.
              </p>
            </div>
          )}

          {results.map((row) => (
            <ClientStatusCard key={row.motorcycleId} row={row} />
          ))}
        </div>
      </main>
    </div>
  );
}
