"use client";

import { ReactNode } from "react";
import { useLogisticsLoading } from "./LogisticsLoadingProvider";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogisticsTableContainer({ children }: { children: ReactNode }) {
  const { isPending } = useLogisticsLoading();

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "transition-opacity duration-300",
          isPending ? "opacity-30 pointer-events-none" : "opacity-100",
        )}
      >
        {children}
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/5 backdrop-blur-[1px] z-10 animate-in fade-in duration-300">
          <div className="bg-background/90 p-4 rounded-full shadow-md border border-border">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
