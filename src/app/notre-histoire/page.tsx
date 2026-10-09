import type { Metadata } from "next";
import { getShowcaseSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/utils";
import { NotreHistoire } from "@/components/histoire/NotreHistoire";

export const dynamic = "force-dynamic";

const TITLE = "Notre Histoire | Imprimelle — Mobilier & Enseignes Lumineuses Abidjan";
const DESCRIPTION =
  "Plongez dans l'histoire d'Imprimelle, la manufacture ivoirienne de mobilier et d'enseignes lumineuses à Abidjan. Du dessin 3D à l'assemblage LED, découvrez un savoir-faire Made in Côte d'Ivoire.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      locale: "fr_FR",
      url: "https://imprimelle.com/notre-histoire",
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Balisage JSON-LD LocalBusiness / Organization (microdonnées Schema.org).
 * ⚠️ TODO éditorial : renseigner le nom de la co-fondatrice (`founders[1]`) —
 * volontairement laissé générique pour ne pas inventer une donnée indexée.
 */
function buildJsonLd(address?: string): Record<string, unknown> {
  const founders = [
    { "@type": "Person", name: "Loukou Gnamien Emmanuel", jobTitle: "Fondateur — Ingénierie & Design" },
    { "@type": "Person", name: "", jobTitle: "Co-fondatrice — Rigueur & Gestion Client" },
  ].filter((f) => f.name);

  const postal: Record<string, string> = {
    "@type": "PostalAddress",
    addressLocality: "Abidjan",
    addressRegion: "Lagunes",
    addressCountry: "CI",
  };
  if (address) postal.streetAddress = address;

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Organization"],
    "@id": "https://imprimelle.com/#organization",
    name: "Imprimelle",
    alternateName: "Imprimelle CI",
    description:
      "Manufacture ivoirienne d'innovation lumineuse : tables LED, enseignes 3D monumentales, signalétique et mobilier à miroir infini, fabriqués à Abidjan.",
    url: "https://imprimelle.com/notre-histoire",
    slogan: "Façonné à Abidjan. Conçu pour illuminer l'Afrique.",
    founder: founders,
    address: postal,
    areaServed: [
      { "@type": "Country", name: "Côte d'Ivoire" },
      { "@type": "Country", name: "Cameroun" },
      { "@type": "Country", name: "Sénégal" },
      { "@type": "Country", name: "Burkina Faso" },
      { "@type": "Country", name: "Mali" },
      { "@type": "Country", name: "Guinée" },
    ],
    knowsLanguage: "fr",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "CI",
      availableLanguage: ["French"],
    },
  };
}

export default async function NotreHistoirePage() {
  const settings = await getShowcaseSettings();
  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const jsonLd = buildJsonLd(settings.contact?.address);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NotreHistoire whatsapp={whatsapp} />
    </>
  );
}
