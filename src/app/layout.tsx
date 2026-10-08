import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopNav } from "@/components/layout/TopNav";
import { ChromeFooter } from "@/components/layout/ChromeFooter";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { ToastContainer } from "@/components/ui/Toast";
import { getShowcaseSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/utils";
import { resolveCategories } from "@/lib/categories";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getShowcaseSettings();
  const site = settings.meta?.site_name || "Imprimelle CI";
  const defaultTitle =
    settings.meta?.default_title || "Imprimelle CI — Enseignes & Mobilier Lumineux Sur Mesure";
  const description =
    settings.meta?.default_description ||
    "Fabricant d'enseignes, de signalétique et de mobilier lumineux en Côte d'Ivoire. Caissons, lettres 3D, totems, néons, tables et décorations lumineuses. Fabrication 7-10 jours. Installation à Abidjan.";
  const headersList = await headers();
  const pathname = headersList.get("x-canonical-path") || "/";
  return {
    metadataBase: new URL(settings.meta?.domain || "https://imprimelle.com"),
    alternates: {
      canonical: `https://imprimelle.com${pathname}`,
    },
    title: {
      default: defaultTitle,
      template: `%s | ${site}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: site,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getShowcaseSettings();
  const whatsapp = normalizePhone(settings.contact?.whatsapp);
  const phone = normalizePhone(settings.contact?.phone || settings.contact?.whatsapp);
  const catalog = resolveCategories(settings.catalog);

  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers categories={catalog}>
          <TopNav whatsapp={whatsapp} phone={phone} />
          <main className="flex-1">{children}</main>
          <ChromeFooter social={settings.social} contact={settings.contact} whatsapp={whatsapp} />
          <CookieConsent />
          <AnalyticsScripts
            pixelId={settings.analytics?.fb_pixel_id}
            umamiWebsiteId={settings.analytics?.umami_website_id}
            umamiScriptUrl={settings.analytics?.umami_script_url}
            posthogKey={settings.analytics?.posthog_key}
            posthogHost={settings.analytics?.posthog_host}
          />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
