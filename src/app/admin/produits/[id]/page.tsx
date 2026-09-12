import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductEditClient } from "./ProductEditClient";
import type { ShowcaseProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("*").eq("id", id).single();

  if (!product) notFound();

  return <ProductEditClient product={product as ShowcaseProduct} />;
}
