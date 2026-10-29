"use client";

import { useMemo, useRef, useState } from "react";
import { Bold, Underline, AtSign, X } from "lucide-react";
import { normalizeForSearch } from "@/lib/utils";

export interface MentionProduct {
  id: string;
  name: string;
  slug: string;
}

/**
 * Champ texte pour un message du bandeau d'annonce :
 *   - boutons « Gras » / « Souligné » qui enrobent la sélection avec `*…*` / `_…_` ;
 *   - suggestion de produit en tapant « @ » → insère `[Nom du produit](slug)`.
 */
export function MentionTextInput({
  value,
  onChange,
  products,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  products: MentionProduct[];
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selRef = useRef({ start: 0, end: 0 });
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = normalizeForSearch(mentionQuery.trim());
    if (!q) return products.slice(0, 6);
    return products.filter((p) => normalizeForSearch(p.name).includes(q)).slice(0, 6);
  }, [mentionQuery, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const cursor = e.target.selectionStart ?? v.length;
    selRef.current = { start: cursor, end: cursor };
    onChange(v);
    const before = v.slice(0, cursor);
    const m = before.match(/@([^\s@]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  const insertMention = (slug: string, name: string) => {
    const v = value;
    const cursor = selRef.current.end ?? v.length;
    const before = v.slice(0, cursor);
    const after = v.slice(cursor);
    const idx = before.lastIndexOf("@");
    const next = before.slice(0, idx) + `[${name}](${slug}) ` + after;
    onChange(next);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const wrapSelection = (marker: string) => {
    const v = value;
    const { start, end } = selRef.current;
    const before = v.slice(0, start);
    const sel = v.slice(start, end) || "texte";
    const after = v.slice(end);
    const next = `${before}${marker}${sel}${marker}${after}`;
    onChange(next);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          title="Gras — sélectionnez du texte puis cliquez (*texte*)"
          onClick={() => wrapSelection("*")}
          className="shrink-0 h-10 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Souligné — sélectionnez du texte puis cliquez (_texte_)"
          onClick={() => wrapSelection("_")}
          className="shrink-0 h-10 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onSelect={(e) => {
              selRef.current = {
                start: e.currentTarget.selectionStart ?? 0,
                end: e.currentTarget.selectionEnd ?? 0,
              };
            }}
            onBlur={() => {
              // Délai pour laisser le clic sur une suggestion aboutir avant de fermer.
              setTimeout(() => setMentionQuery(null), 150);
            }}
            placeholder={placeholder ?? "Texte… (*gras*, _souligné_, @produit)"}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
          <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
        </div>
      </div>

      {mentionQuery !== null && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] shadow-lg overflow-hidden divide-y divide-[var(--color-border-default)]">
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertMention(p.slug, p.name)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <span className="flex-1 min-w-0 truncate">{p.name}</span>
              <span className="text-xs text-[var(--color-text-tertiary)] truncate max-w-[40%]">
                {p.slug}
              </span>
            </button>
          ))}
        </div>
      )}

      {mentionQuery !== null && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-2 text-xs text-[var(--color-text-tertiary)] shadow-lg flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> Aucun produit trouvé pour « {mentionQuery} »
        </div>
      )}
    </div>
  );
}
