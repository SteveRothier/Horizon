"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domAnimation } from "framer-motion";
import { useState, type ReactNode } from "react";
import { WEATHER_STALE_TIME_MS } from "@/constants/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: WEATHER_STALE_TIME_MS,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </QueryClientProvider>
  );
}
