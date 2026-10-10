"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Loader2,
  Check,
  AlertTriangle,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { imgProxyUrl } from "@/lib/images";
import { CATEGORIES, getCategoryLabel, resolveFamily } from "@/lib/categories";
import type { ShowcaseProduct, ProductVariant } from "@/lib/products";
import type { ProductParameter } from "@/types";

interface PriceTableClientProps {
  products: ShowcaseProduct[];
  parameters: ProductParameter[];
}

interface Row {
  product: ShowcaseProduct;
  variant: ProductVariant | null;
}

type CellStatus = "idle" | "saving" | "saved" | "error";

/**
 * Vue « Prix » façon tableur : une ligne par variante, édition inline des prix.
 * Auto-save au blur (ou Entrée) → PUT /api/admin/products/[id] avec `showcase.variants`.
 */
export function PriceTableClient({ products, parameters }: PriceTableClientProps) {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");

  // Source de vérité des variantes (par produit), pour commit complet au PUT.
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>(() => {
    const map: Record<string, ProductVariant[]> = {};
    for (const p of products) map[p.id] = p.variants;
    return map;
  });

  const [cellStatus, setCellStatus] = useState<Record<string, CellStatus>>({});

  // Params indexés par id (pour afficher les options actives).
  const paramById = useMemo(() => {
    const m = new Map<string, ProductParameter>();
    for (const p of parameters) m.set(p.id, p);
    return m;
  }, [parameters]);

  // Aplatit produits → lignes (une par variante ; null si aucune variante).
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const p of products) {
      const q = search.toLowerCase();
      const familyId = resolveFamily(p.showcase?.family, p.showcase?.category);
      if (familyFilter !== "all" && familyId !== familyFilter) continue;
      if (
        search &&
        !p.name.toLowerCase().includes(q) &&
        !(familyId || "").toLowerCase().includes(q)
      )
        continue;
      const variants = variantsByProduct[p.id] ?? [];
      if (variants.length === 0) out.push({ product: p, variant: null });
      else for (const v of variants) out.push({ product: p, variant: v });
    }
    return out;
  }, [products, variantsByProduct, search, familyFilter]);

  const commit = async (
    productId: string,
    variantId: string,
    patch: Partial<ProductVariant>,
    field: "name" | "price"
  ) => {
    const key = `${productId}:${variantId}:${field}`;
    setCellStatus((s) => ({ ...s, [key]: "saving" }));

    // Applique la modification localement puis envoie le tableau complet (merge serveur).
    const nextVariants = (variantsByProduct[productId] ?? []).map((v) =>
      v.id === variantId ? { ...v, ...patch } : v
    );
    setVariantsByProduct((prev) => ({ ...prev, [productId]: nextVariants }));

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showcase: { variants: nextVariants } }),
      });
      setCellStatus((s) => ({ ...s, [key]: res.ok ? "saved" : "error" }));
    } catch {
      setCellStatus((s) => ({ ...s, [key]: "error" }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Prix</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {products.length} produit{products.length > 1 ? "s" : ""} publié{products.length > 1 ? "s" : ""} — modifiez les prix de chaque variante directement dans le tableau.
          </p>
        </div>
        <Link
          href="/admin/reglages#parametres"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <SlidersHorizontal className="w-4 h-4" /> Options de paramètres
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
        </div>
        <select
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-secondary)]"
        >
          <option value="all">Toutes familles</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--color-bg-secondary)] text-left text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Produit</th>
                <th className="px-3 py-2.5 font-semibold">Variante</th>
                <th className="px-3 py-2.5 font-semibold w-44">Prix (FCFA)</th>
                <th className="px-3 py-2.5 font-semibold">Options actives</th>
                <th className="px-3 py-2.5 font-semibold w-16 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-default)]">
              {rows.map(({ product, variant }, i) => {
                const familyId = resolveFamily(product.showcase?.family, product.showcase?.category);
                const activeParams = (product.showcase?.active_parameters || [])
                  .map((id) => paramById.get(id))
                  .filter((x): x is ProductParameter => Boolean(x));
                const noVariants = variant === null;

                return (
                  <tr key={`${product.id}:${variant?.id ?? "none"}`} className={cn(i % 2 === 0 ? "bg-[var(--color-surface-card)]" : "bg-[var(--color-bg-tertiary)]")}>
                    {/* Produit */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-2 min-w-[220px]">
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
                          {product.main_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgProxyUrl(product.main_image_url, 80, 100)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-sm">✨</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/produits/${product.id}`} className="block text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-blue)] truncate max-w-[240px]">
                            {product.name}
                          </Link>
                          <span className="block text-xs text-[var(--color-text-tertiary)]">
                            {familyId ? getCategoryLabel(product.showcase?.category || familyId) : "Sans famille"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Variante */}
                    <td className="px-3 py-2 align-top text-[var(--color-text-secondary)]">
                      {noVariants ? (
                        <span className="text-xs text-[var(--color-text-tertiary)] italic">Sur devis uniquement</span>
                      ) : (
                        <div className="min-w-[160px]">
                          <NameCell
                            productId={product.id}
                            variant={variant!}
                            status={cellStatus[`${product.id}:${variant!.id}:name`] ?? "idle"}
                            onSave={commit}
                          />
                          {variant!.attributes?.dimensions && (
                            <span className="block text-xs text-[var(--color-text-tertiary)] mt-1">{variant!.attributes.dimensions}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Prix */}
                    <td className="px-3 py-2 align-top">
                      {noVariants ? (
                        <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
                      ) : (
                        <PriceCell
                          productId={product.id}
                          variant={variant!}
                          status={cellStatus[`${product.id}:${variant!.id}:price`] ?? "idle"}
                          onSave={commit}
                        />
                      )}
                    </td>

                    {/* Options actives */}
                    <td className="px-3 py-2 align-top">
                      {activeParams.length === 0 ? (
                        <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {activeParams.map((prm) => {
                            const paid = prm.options.filter((o) => (o.price ?? 0) > 0).length;
                            const tooltip = prm.options
                              .map((o) => `${o.label}${(o.price ?? 0) > 0 ? ` (+${o.price})` : ""}`)
                              .join(" · ");
                            return (
                              <Link
                                key={prm.id}
                                href="/admin/reglages#parametres"
                                title={tooltip}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-accent-blue)] hover:text-[var(--color-text-primary)] transition-colors"
                              >
                                {prm.name}
                                {paid > 0 && <span className="text-[var(--color-accent-amber)]">· {paid} payant{paid > 1 ? "s" : ""}</span>}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Fiche publique */}
                    <td className="px-3 py-2 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/produits/${product.id}`} title="Modifier le produit" className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <a href={`/collection/${product.slug}`} target="_blank" rel="noopener noreferrer" title="Voir la fiche" className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="text-sm text-[var(--color-text-tertiary)] text-center py-10">Aucun produit trouvé.</p>
        )}
      </div>
    </div>
  );
}

/* ===== Cellule de nom de variante éditable inline ===== */
function NameCell({
  productId,
  variant,
  status,
  onSave,
}: {
  productId: string;
  variant: ProductVariant;
  status: CellStatus;
  onSave: (productId: string, variantId: string, patch: Partial<ProductVariant>, field: "name" | "price") => void;
}) {
  const [text, setText] = useState(variant.name);
  // Resync si le nom remonte du parent (après sauvegarde) — pattern « adjust state during render ».
  const [lastName, setLastName] = useState(variant.name);
  if (lastName !== variant.name) {
    setLastName(variant.name);
    setText(variant.name);
  }

  const commitText = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setText(variant.name); // revert si vide (un nom vide supprimerait la variante côté serveur)
      return;
    }
    if (trimmed !== variant.name) onSave(productId, variant.id, { name: trimmed }, "name");
  };

  return (
    <div className="relative max-w-[220px]">
      <input
        type="text"
        value={text}
        placeholder="Nom de la variante"
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-full h-9 px-2.5 pr-7 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-sm font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)]"
      />
      {status !== "idle" && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {status === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent-blue)]" />}
          {status === "saved" && <Check className="w-3.5 h-3.5 text-green-500" />}
          {status === "error" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        </span>
      )}
    </div>
  );
}

/* ===== Cellule de prix éditable inline ===== */
function PriceCell({
  productId,
  variant,
  status,
  onSave,
}: {
  productId: string;
  variant: ProductVariant;
  status: CellStatus;
  onSave: (productId: string, variantId: string, patch: Partial<ProductVariant>, field: "name" | "price") => void;
}) {
  const [text, setText] = useState(variant.price == null ? "" : String(variant.price));
  // Resync si le prix remonte du parent (après sauvegarde) — pattern « adjust state during render ».
  const [lastPrice, setLastPrice] = useState(variant.price);
  if (lastPrice !== variant.price) {
    setLastPrice(variant.price);
    setText(variant.price == null ? "" : String(variant.price));
  }

  const commitText = () => {
    const trimmed = text.trim().replace(/\s/g, "").replace(",", ".");
    if (trimmed === "") {
      if (variant.price !== null) onSave(productId, variant.id, { price: null }, "price");
      return;
    }
    const num = Number(trimmed);
    if (Number.isFinite(num) && num >= 0) {
      const rounded = Math.round(num);
      if (rounded !== variant.price) onSave(productId, variant.id, { price: rounded }, "price");
      else setText(String(rounded));
    } else {
      setText(variant.price == null ? "" : String(variant.price));
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-[180px] max-w-full">
        <input
          type="text"
          inputMode="numeric"
          value={text}
          placeholder="Sur devis"
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-full h-9 px-2.5 pr-7 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] font-mono tabular-nums text-right placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)]"
        />
        {status !== "idle" && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {status === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent-blue)]" />}
            {status === "saved" && <Check className="w-3.5 h-3.5 text-green-500" />}
            {status === "error" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          </span>
        )}
      </div>
      {variant.price == null && (
        <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide shrink-0">Sur devis</span>
      )}
    </div>
  );
}
