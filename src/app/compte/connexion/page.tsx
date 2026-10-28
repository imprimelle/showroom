"use client";

import { useState } from "react";
import { Phone, ArrowRight } from "lucide-react";

export default function ConnexionPage() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/member/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStep("code");
      else setError(data?.error || "Impossible d'envoyer le code.");
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/member/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = "/compte";
      } else {
        setError(data?.error || "Code invalide.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full h-12 px-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-base text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:outline-none";

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] text-center">
        Connexion
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)] text-center">
        Accédez à vos commandes, votre affiliation ou votre point de vente.
      </p>

      {/* Boutons sociaux */}
      <div className="mt-6 space-y-2">
        <a
          href="/api/member/oauth/google?next=/compte"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-[var(--color-border-strong)] bg-white text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-bg-tertiary)]"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuer avec Google
        </a>
        <a
          href="/api/member/oauth/facebook?next=/compte"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#1877F2] text-white text-sm font-medium hover:bg-[#166fe0]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z"/></svg>
          Continuer avec Facebook
        </a>
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border-default)]" />
        <span className="text-xs text-[var(--color-text-tertiary)]">ou par téléphone</span>
        <div className="flex-1 h-px bg-[var(--color-border-default)]" />
      </div>

      {step === "phone" ? (
        <form onSubmit={requestOtp} className="space-y-3">
          <label className="text-xs text-[var(--color-text-secondary)] flex flex-col gap-1.5">
            Numéro de téléphone (WhatsApp)
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 01 23 45 67"
              required
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-medium disabled:opacity-50"
          >
            <Phone className="w-4 h-4" /> {busy ? "Envoi…" : "Recevoir un code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Code envoyé au <strong>{phone}</strong>
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            required
            className={inputCls}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-medium disabled:opacity-50"
          >
            {busy ? "Vérification…" : "Se connecter"} <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-[var(--color-text-secondary)] hover:underline">
            Modifier le numéro
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
