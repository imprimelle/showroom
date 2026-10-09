import { IntroSection } from "./IntroSection";
import { DualFocusSection } from "./DualFocusSection";
import { FabricationSection } from "./FabricationSection";
import { AfricaMapSection } from "./AfricaMapSection";
import { CtaSection } from "./CtaSection";

/**
 * Orchestrateur de la page « Notre Histoire ».
 * Structure HTML5 sémantique : <main> + <section>/<article> délégués aux
 * composants clients (qui sont tout de même rendus côté serveur → SEO).
 */
export function NotreHistoire({ whatsapp }: { whatsapp: string }) {
  return (
    <main className="histoire-glow-bg min-h-screen text-white overflow-x-hidden antialiased">
      <IntroSection />
      <DualFocusSection />
      <FabricationSection />
      <AfricaMapSection />
      <CtaSection whatsapp={whatsapp} />
    </main>
  );
}
