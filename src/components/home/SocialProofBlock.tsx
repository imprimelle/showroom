/**
 * Bloc « Preuve sociale » de la page d'accueil :
 *   1. Stat animé (ex. « +1240 ») + libellé (« Business & Particulier »).
 *   2. Titre (« Nous ont fait confiance »).
 *   3. Slider de logos clients (marquee CSS, défilement infini) — image uploadée
 *      via l'admin, sinon nom de l'entreprise en toutes lettres.
 *
 * Contenu piloté par les réglages admin (`home.social_proof_stat`,
 * `home.social_proof_label`, `home.reassurance_title`, `home.logos`).
 */

import type { ClientLogo } from "@/types";
import { SocialProofStat } from "./SocialProofStat";

export function SocialProofBlock({
  stat = "+1240",
  label = "Business & Particulier",
  title = "Nous ont fait confiance",
  logos,
}: {
  stat?: string;
  label?: string;
  title?: string;
  logos?: ClientLogo[];
}) {
  const resolvedLogos = (logos && logos.length > 0 ? logos : []).filter((l) => l.name || l.logo_url);

  return (
    <section className="border-y border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* 1. Stat animé + titre */}
        <div className="flex flex-col items-center text-center">
          <SocialProofStat value={stat} label={label} />
          <h2 className="mt-2 font-display text-xl font-bold text-[var(--color-text-primary)] md:text-2xl">
            {title}
          </h2>
        </div>

        {/* 2. Slider de logos (marquee) */}
        {resolvedLogos.length > 0 && (
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="logo-marquee flex w-max items-center">
              {[...resolvedLogos, ...resolvedLogos].map((logo, i) => (
                <span
                  key={i}
                  className="flex h-12 items-center gap-2.5 whitespace-nowrap px-8 text-[var(--color-text-tertiary)]"
                >
                  {logo.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.logo_url}
                      alt={logo.name}
                      className="h-8 w-auto max-w-[140px] object-contain opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-9"
                    />
                  ) : (
                    <span className="text-base font-bold tracking-wide text-[var(--color-text-secondary)] md:text-lg">
                      {logo.name}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
