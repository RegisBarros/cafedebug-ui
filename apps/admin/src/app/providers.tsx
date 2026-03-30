"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

const shouldRetryRequest = (
  failureCount: number,
  error: unknown
): boolean => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === "number" && status >= 400 && status < 500) {
      return false;
    }
  }

  return failureCount < 2;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetryRequest,
            staleTime: 20_000
          },
          mutations: {
            retry: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
