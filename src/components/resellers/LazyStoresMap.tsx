"use client";

import dynamic from "next/dynamic";
import type { PublicStore } from "@/types";

// `ssr: false` est interdit dans un Server Component (Next 16) → ce wrapper client
// code-split la carte Leaflet : Leaflet + tuiles OSM ne pèsent plus sur le chargement
// initial de la home. Le composant initialise déjà la carte à l'approche du viewport
// (IntersectionObserver) — un placeholder neutre occupe la place en attendant.
const StoresMap = dynamic(() => import("./StoresMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[360px] md:h-[440px] w-full rounded-2xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-bg-tertiary)] animate-pulse"
      aria-hidden="true"
    />
  ),
});

export function LazyStoresMap({ stores }: { stores: PublicStore[] }) {
  return <StoresMap stores={stores} />;
}
