import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFAB } from "@/components/layout/WhatsAppFAB";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { ToastContainer } from "@/components/ui/Toast";
import { getShowcaseSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/utils";

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

export const metadata: Metadata = {
  title: {
    default: "Imprimelle CI — Enseignes & Mobilier Lumineux Sur Mesure",
    template: "%s | Imprimelle CI",
  },
  description:
    "Fabricant d'enseignes, de signalétique et de mobilier lumineux en Côte d'Ivoire. Caissons, lettres 3D, totems, néons, tables et décorations lumineuses. Fabrication 7-10 jours. Installation à Abidjan.",
  metadataBase: new URL("https://imprimelle.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Imprimelle CI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getShowcaseSettings();
  const whatsapp = normalizePhone(settings.contact?.whatsapp);

  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <TopNav whatsapp={whatsapp} />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFAB whatsapp={whatsapp} />
          <CookieConsent />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
