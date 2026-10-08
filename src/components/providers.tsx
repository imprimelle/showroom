"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useCurrencyStore } from "@/stores/currency";
import { setCategories } from "@/lib/categories";
import type { Category } from "@/lib/categories";

export function Providers({
  children,
  categories,
}: {
  children: ReactNode;
  /** Catalogue de catégories résolu côté serveur, hydraté côté client avant le rendu. */
  categories?: Category[];
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Hydrate le catalogue côté client AVANT le rendu des enfants (idempotent,
  // exécuté une fois au montage). Le repli sur les valeurs par défaut est géré
  // par `setCategories` (liste vide → conservée).
  useState(() => {
    if (categories && categories.length > 0) setCategories(categories);
    return null;
  });

  // Détection de la devise (pays du visiteur) — client uniquement.
  useEffect(() => {
    useCurrencyStore.getState().init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
