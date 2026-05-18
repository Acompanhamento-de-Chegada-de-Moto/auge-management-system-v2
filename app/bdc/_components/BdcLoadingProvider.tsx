"use client";

import { createContext, useContext, ReactNode } from "react";

interface LoadingContextType {
  isPending: boolean;
}

const LoadingContext = createContext<LoadingContextType>({ isPending: false });

export const useBdcLoading = () => useContext(LoadingContext);

export function BdcLoadingProvider({
  children,
  isPending,
}: {
  children: ReactNode;
  isPending: boolean;
}) {
  return (
    <LoadingContext.Provider value={{ isPending }}>
      {children}
    </LoadingContext.Provider>
  );
}
