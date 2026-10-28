import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace affilié",
  description: "Suivez vos performances d'affiliation Imprimelle.",
  robots: { index: false, follow: false },
};

/**
 * L'ancien dashboard par code public (`/affilies/[code]`) est déprécié :
 * l'espace affilié est désormais authentifié dans `/compte/affiliation`.
 */
export default function AffiliateDashboardPage() {
  redirect("/compte/connexion?next=/compte/affiliation");
}
