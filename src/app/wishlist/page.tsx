import type { Metadata } from "next";
import { WishlistClient } from "@/components/wishlist/WishlistClient";

export const metadata: Metadata = {
  title: "Ma wishlist",
  description: "Vos produits favoris enregistrés.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}
