"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useCurrencyStore } from "@/stores/currency";
import { useRemisesStore } from "@/stores/remises";
import { setCategories } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import type { ShowcaseSettings } from "@/types";

export function Providers({
  children,
  categories,
  remises,
}: {
  children: ReactNode;
  /** Catalogue de catégories résolu côté serveur, hydraté côté client avant le rendu. */
  categories?: Category[];
  /** Config remises/surplus brute, résolue + hydratée côté client. */
  remises?: ShowcaseSettings["remises"];
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

  // Hydrate les remises/surplus côté client (idempotent, avant rendu des enfants).
  useState(() => {
    useRemisesStore.getState().setConfig(remises);
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
