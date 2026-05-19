"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [_, startTransition] = useTransition();

  // biome-ignore lint/correctness/useExhaustiveDependencies: add route and searchParams to dependencies will cause an infinite loop
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`?${params.toString()}`);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="relative min-w-100">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Pesquise pelo nome do cliente ou chassi"
        className="pl-10 rounded-xl"
      />
    </div>
  );
}
