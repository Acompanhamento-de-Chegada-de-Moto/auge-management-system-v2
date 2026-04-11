"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  isPending,
  startTransition,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams],
  );

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    startTransition(() => {
      router.push(`?${createQueryString({ page })}`);
    });
  }

  function handlePageSizeChange(value: string) {
    const newPageSize = Number(value);
    startTransition(() => {
      // Quando muda o tamanho da página, voltamos para a página 1 para evitar inconsistências
      router.push(`?${createQueryString({ pageSize: newPageSize, page: 1 })}`);
    });
  }

  // Lógica para gerar os números das páginas mostradas
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) end = 4;
      if (currentPage >= totalPages - 1) start = totalPages - 3;

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Itens por página:
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={handlePageSizeChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-[70px] h-8 text-xs cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((size) => (
              <SelectItem
                key={size}
                value={String(size)}
                className="text-xs cursor-pointer"
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8 cursor-pointer"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isPending}
          title="Primeira página"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 cursor-pointer"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isPending}
          title="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, i) => (
            <div key={i}>
              {p === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === p ? "default" : "outline"}
                  size="icon"
                  className="size-8 text-xs cursor-pointer"
                  onClick={() => handlePageChange(p as number)}
                  disabled={isPending}
                >
                  {p}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-8 cursor-pointer"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isPending}
          title="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 cursor-pointer"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isPending}
          title="Última página"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        {isPending && <Loader2 className="size-3 animate-spin" />}
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>
    </div>
  );
}
