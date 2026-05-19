"use client";

import { ReactNode, Suspense, useTransition } from "react";
import { BdcLoadingProvider } from "./BdcLoadingProvider";
import { BdcTableContainer } from "./BdcTableContainer";
import { PaginationControls } from "@/app/logistics/_components/PaginationControls";

interface Props {
  children: ReactNode;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

function BdcPaginationControls({
  currentPage,
  totalPages,
  pageSize,
  isPending,
  startTransition,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}) {
  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      isPending={isPending}
      startTransition={startTransition}
    />
  );
}

export function BdcClientWrapper({
  children,
  currentPage,
  totalPages,
  pageSize,
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <BdcLoadingProvider isPending={isPending}>
      <div className="flex flex-col gap-4">
        <BdcTableContainer>{children}</BdcTableContainer>

        <Suspense fallback={<div className="h-12 border-t border-border" />}>
          <BdcPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            isPending={isPending}
            startTransition={startTransition}
          />
        </Suspense>
      </div>
    </BdcLoadingProvider>
  );
}
