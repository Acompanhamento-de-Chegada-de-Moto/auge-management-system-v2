"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

export function ClientSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(
    searchParams.get("search")?.toString() || "",
  );

  const updateUrl = useCallback(
    (term: string) => {
      const params = new URLSearchParams(window.location.search);
      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }

      startTransition(() => {
        // Usamos replace para evitar poluir o histórico durante a digitação
        router.replace(`/?${params.toString()}`, { scroll: false });
      });
    },
    [router],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value !== (searchParams.get("search") || "")) {
        updateUrl(value);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, updateUrl, searchParams]);

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      <Input
        type="text"
        placeholder="Pesquise pelo nome do cliente ou numero do chassi"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 h-11 rounded-xl border-zinc-300 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
