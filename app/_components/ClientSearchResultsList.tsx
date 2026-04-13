"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ClientStatusCard } from "./ClientStatusCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { BdcClientTableRow } from "@/app/data/bdc/bdc-get-client-rows";

async function fetchClientSearchResults(
  query: string,
): Promise<BdcClientTableRow[]> {
  if (!query || query.length < 3) return [];

  const response = await fetch(
    `/api/public/clients/search?query=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error("Falha ao buscar dados");
  }
  return response.json();
}

export function ClientSearchResultsList() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search") || "";

  const {
    data: results,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["client-search", query],
    queryFn: () => fetchClientSearchResults(query),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache para busca publica
  });

  if (query.length > 0 && query.length < 3) {
    return (
      <p className="text-sm text-zinc-500">
        Digite pelo menos 3 caracteres para pesquisar...
      </p>
    );
  }

  if (query.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row border rounded-xl overflow-hidden h-[200px] md:h-[160px]"
          >
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="w-full md:w-64 bg-zinc-50 p-6 space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 border-2 border-dashed border-red-200 rounded-xl text-center bg-red-50">
        <p className="text-red-500 font-medium">
          Ocorreu um erro ao buscar os dados. Por favor, tente novamente mais
          tarde.
        </p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-zinc-200 rounded-xl text-center">
        <p className="text-zinc-500">
          Nenhum resultado encontrado para &quot;{query}&quot;.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mt-4 flex flex-col gap-6 transition-opacity duration-200 ${isFetching ? "opacity-70" : "opacity-100"}`}
    >
      {results.map((row) => (
        <ClientStatusCard key={row.motorcycleId} row={row} />
      ))}
    </div>
  );
}
