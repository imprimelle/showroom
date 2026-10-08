"use client";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { WhatsAppFAB } from "./WhatsAppFAB";
import type { ShowcaseSettings } from "@/types";

/**
 * Chrome bas de page (footer + FAB) masqué sur les pages focalisées (checkout).
 * Composant CLIENT : `usePathname()` se met à jour à chaque navigation soft,
 * contrairement à la lecture serveur de `x-canonical-path` dans le layout racine
 * (qui ne se re-rend pas lors d'un router.push → topbar/footer qui restaient visibles).
 */
export function ChromeFooter({
  social,
  contact,
  whatsapp,
}: {
  social?: ShowcaseSettings["social"];
  contact?: ShowcaseSettings["contact"];
  whatsapp?: string;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout")) return null;
  return (
    <>
      <Footer social={social} contact={contact} />
      <WhatsAppFAB whatsapp={whatsapp} />
    </>
  );
}
