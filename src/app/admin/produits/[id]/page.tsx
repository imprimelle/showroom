import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductEditClient } from "./ProductEditClient";
import type { ShowcaseProduct } from "@/lib/products";
import { DEFAULT_PRODUCT_PARAMETERS } from "@/lib/parameters";
import type { ProductParameter } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: product }, { data: settingsRow }] = await Promise.all([
    admin.from("products").select("*").eq("id", id).single(),
    admin.from("showcase_settings").select("data").eq("id", 1).single(),
  ]);

  if (!product) notFound();

  const catalog =
    (settingsRow?.data?.product_parameters as ProductParameter[]) || DEFAULT_PRODUCT_PARAMETERS;

  return <ProductEditClient product={product as ShowcaseProduct} availableParameters={catalog} />;
}
