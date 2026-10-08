import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductListClient } from "./ProductListClient";
import { NewProductButton } from "@/components/admin/NewProductButton";
import { resolveVariants, type ShowcaseProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Produits</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {products?.filter((p: any) => p.is_published).length || 0}/{products?.length || 0} publiés
          </p>
        </div>
        <NewProductButton />
      </div>
      <ProductListClient products={(products || []).map((p: any) => ({ ...p, variants: resolveVariants(p) })) as ShowcaseProduct[]} />
    </div>
  );
}
