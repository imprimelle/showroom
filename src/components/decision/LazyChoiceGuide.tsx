"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ShowcaseProduct } from "@/lib/products";

// Le quiz « Trouvez le produit parfait » est en bas de page. On le code-split
// (ssr:false) ET on ne le monte qu'à l'approche du viewport, pour ne pas faire
// peser son JS (icônes lucide + ProductCard + logique) sur l'hydratation initiale.
// Aucun impact SEO : le résultat du quiz n'est de toute façon rendu que côté client.
const ChoiceGuide = dynamic(
  () => import("./ChoiceGuide").then((m) => m.ChoiceGuide),
  { ssr: false }
);

export function LazyChoiceGuide({ products }: { products: ShowcaseProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: inView ? undefined : 320 }}>
      {inView ? <ChoiceGuide products={products} /> : null}
    </div>
  );
}
