"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { FC, PropsWithChildren } from "react";
import { queryClient } from "./queryClient";

export const QueryClientProviderWrapper: FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
