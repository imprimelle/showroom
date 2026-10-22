import type { Metadata } from "next";
import { AffiliateDashboardClient } from "./AffiliateDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace affilié",
  description: "Suivez vos performances d'affiliation Imprimelle : ventes, commissions et lien de partage.",
  robots: { index: false, follow: false },
};

export default async function AffiliateDashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <AffiliateDashboardClient code={code} />;
}
