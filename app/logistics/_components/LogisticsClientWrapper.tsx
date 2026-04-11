"use client";

import { ReactNode, useTransition } from "react";
import { LogisticsLoadingProvider } from "./LogisticsLoadingProvider";
import { LogisticsTableContainer } from "./LogisticsTableContainer";
import { PaginationControls } from "./PaginationControls";

interface Props {
  children: ReactNode;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export function LogisticsClientWrapper({
  children,
  currentPage,
  totalPages,
  pageSize,
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <LogisticsLoadingProvider isPending={isPending}>
      <div className="flex flex-col gap-4">
        <LogisticsTableContainer>{children}</LogisticsTableContainer>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          isPending={isPending}
          startTransition={startTransition}
        />
      </div>
    </LogisticsLoadingProvider>
  );
}
