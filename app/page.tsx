import { ClientSearchInput } from "./_components/ClientSearchInput";
import { ClientSearchResultsList } from "./_components/ClientSearchResultsList";
import { Suspense } from "react";

export default async function Home() {
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

        <Suspense fallback={<div className="h-11 w-full max-w-md bg-zinc-200 animate-pulse rounded-xl" />}>
          <ClientSearchInput />
        </Suspense>

        <div className="mt-4">
          <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-40 bg-zinc-200 rounded-xl" /><div className="h-40 bg-zinc-200 rounded-xl" /></div>}>
            <ClientSearchResultsList />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
