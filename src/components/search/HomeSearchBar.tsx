"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useUiStore } from "@/stores/ui";

interface HomeSearchBarProps {
  /** Question affichée par l'animation d'écriture. */
  question: string;
  /** Titres de produits tapés en alternance avec la question. */
  terms: string[];
}

const TYPE_MS = 55; // vitesse d'écriture (ms/caractère)
const HOLD_MS = 2000; // pause après chaque phrase
const CLEAR_MS = 220; // durée de l'effacement avant la phrase suivante

/**
 * Barre de recherche de la page d'accueil : pseudo-input (bouton) au placeholder
 * animé lettre par lettre (question → titre produit → question → …). Le clic ouvre
 * le volet recherche du menu plein écran (TopNav).
 */
export function HomeSearchBar({ question, terms }: HomeSearchBarProps) {
  const openSearch = useUiStore((s) => s.openSearch);

  const phrases = useMemo(() => {
    const clean = terms.map((t) => t.trim()).filter(Boolean).slice(0, 8);
    if (clean.length === 0) return [question];
    const seq: string[] = [question];
    clean.forEach((t) => {
      seq.push(t);
      seq.push(question);
    });
    return seq;
  }, [question, terms]);

  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "clearing">("typing");

  const phrase = phrases[index % phrases.length];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (chars < phrase.length) {
        t = setTimeout(() => setChars((c) => c + 1), TYPE_MS);
      } else {
        t = setTimeout(() => setPhase("holding"), 60);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("clearing"), HOLD_MS);
    } else {
      t = setTimeout(() => {
        setChars(0);
        setIndex((i) => i + 1);
        setPhase("typing");
      }, CLEAR_MS);
    }
    return () => clearTimeout(t);
  }, [phase, chars, phrase, index]);

  const text = phrase.slice(0, chars);

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Rechercher un produit"
      className="w-full flex items-center gap-3 h-12 md:h-14 px-4 md:px-5 rounded-full bg-[var(--color-bg-tertiary)] text-left hover:bg-[var(--color-border-default)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/40"
    >
      <Search className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />
      <span className="flex-1 min-w-0 truncate font-bold text-sm md:text-base text-[var(--color-text-secondary)]">
        {text}
        <span
          className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] rounded-sm bg-[var(--color-text-secondary)] animate-pulse"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
