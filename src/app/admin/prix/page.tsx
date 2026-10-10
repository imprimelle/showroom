import { createAdminClient } from "@/lib/supabase/admin";
import { resolveVariants, type ShowcaseProduct } from "@/lib/products";
import { DEFAULT_PRODUCT_PARAMETERS } from "@/lib/parameters";
import type { ProductParameter } from "@/types";
import { PriceTableClient } from "./PriceTableClient";

export const dynamic = "force-dynamic";

export default async function AdminPrixPage() {
  const admin = createAdminClient();
  const [{ data: products }, { data: settingsRow }] = await Promise.all([
    admin.from("products").select("*").eq("is_published", true).order("name"),
    admin.from("showcase_settings").select("data").eq("id", 1).single(),
  ]);

  const parameters: ProductParameter[] =
    (settingsRow?.data?.product_parameters as ProductParameter[]) || DEFAULT_PRODUCT_PARAMETERS;

  const resolved = (products || []).map(
    (p) => ({ ...p, variants: resolveVariants(p) }) as ShowcaseProduct
  );

  return (
    <PriceTableClient
      products={resolved}
      parameters={parameters}
    />
  );
}
