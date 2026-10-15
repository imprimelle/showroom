"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Banknote, MessageCircle, ChevronDown, Lock } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useCheckoutStore } from "@/stores/checkout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useFormatPrice, useCurrencyStore } from "@/stores/currency";
import { createOrderSchema } from "@/schemas/order";
import { track } from "@/lib/analytics";
import { COUNTRIES } from "@/lib/countries";
import { DEFAULT_SHIPPING_ZONES, shippingFeeForCountry, type ShippingZone } from "@/lib/shipping";
import { DEFAULT_ONLINE_METHODS, isOnlinePayment, type OnlineMethodDef } from "@/lib/payment";
import { computeDepositBalance } from "@/lib/groupage";
import { imgProxyUrl } from "@/lib/images";
import type { PaymentMethod, OnlinePaymentMethod } from "@/types";

const METHOD_STYLE: Record<OnlinePaymentMethod, { bg: string; fg: string; short: string }> = {
  orange: { bg: "#FF7900", fg: "#ffffff", short: "OM" },
  mtn: { bg: "#FFCB05", fg: "#000000", short: "MTN" },
  wave: { bg: "#1DC9FF", fg: "#00243B", short: "Wave" },
  card: { bg: "#1A1F71", fg: "#ffffff", short: "VISA" },
};

export default function CheckoutPage() {
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const detectedCountry = useCurrencyStore((s) => s.country);
  const { items, getTotal, clearCart } = useCartStore();
  const customer = useCheckoutStore((s) => s.customer);
  const setCustomer = useCheckoutStore((s) => s.setCustomer);
  const total = getTotal();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>(DEFAULT_SHIPPING_ZONES);
  const [paymentMethods, setPaymentMethods] = useState<OnlineMethodDef[]>(DEFAULT_ONLINE_METHODS);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [country, setCountry] = useState<string>(() => {
    const d = (customer.country || detectedCountry || "").toUpperCase();
    return COUNTRIES.some((c) => c.code === d) ? d : "CI";
  });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const countryOptions = COUNTRIES;
  const shippingFee = shippingFeeForCountry(country, { zones });
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // === Groupage : détection + répartition montant de départ / solde (affichage) ===
  const hasGroupage = items.some((i) => i.groupage);
  const groupageFull = items
    .filter((i) => i.groupage)
    .reduce((s, i) => s + i.unit_price_fcfa * i.quantity, 0);
  const groupageDepositConfigured = items.find((i) => i.groupage)?.groupage_deposit_fcfa ?? null;
  const { deposit: groupageDeposit, balance: groupageBalance } = computeDepositBalance(
    groupageFull,
    groupageDepositConfigured
  );
  const depositNow = groupageDeposit + (total - groupageFull) + shippingFee;

  // Éligibilités (tous les articles doivent autoriser).
  // Le groupage exige un acompte en ligne → pas de cash à la livraison seul.
  const allowsCOD = !hasGroupage && items.every((i) => i.cash_on_delivery === true);
  const allowsOnline = items.every((i) => i.groupage || i.online_enabled === true);
  const liveMethods = paymentMethods.filter((m) => m.live);

  // Pré-sélection du mode de paiement (CTA jamais grisé).
  useEffect(() => {
    if (selectedMethod) return;
    setSelectedMethod(allowsCOD ? "cod" : "talk_first");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowsCOD]);

  // Charge zones + méthodes de paiement + état FedaPay.
  useEffect(() => {
    let active = true;
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (Array.isArray(d?.zones) && d.zones.length > 0) setZones(d.zones);
        if (Array.isArray(d?.payment_methods) && d.payment_methods.length > 0) setPaymentMethods(d.payment_methods);
        setOnlineEnabled(d?.online_payment_enabled !== false);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Tracking : début de checkout (une fois, si panier non vide).
  useEffect(() => {
    if (items.length === 0) return;
    track("begin_checkout", { value: total, num_items: items.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Détection desktop (résumé de commande toujours déplié sur desktop).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Écran « panier vide » (la confirmation est gérée par /confirmation, unifiée).
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-[var(--color-text-secondary)]">Panier vide</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 mb-6">Ajoutez des articles avant de commander</p>
        <Link href="/collection"><Button variant="primary">Voir le catalogue</Button></Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!acceptedCGV) {
      setGlobalError("Veuillez accepter les conditions générales de vente.");
      return;
    }
    if (!selectedMethod) {
      setGlobalError("Choisissez un mode de paiement.");
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      customer: {
        name: String(formData.get("name") || ""),
        phone: String(formData.get("phone") || ""),
        address: String(formData.get("address") || ""),
      },
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        variant_label: item.variant_label,
        variant_sku: item.variant_sku,
        quantity: item.quantity,
        unit_price_fcfa: item.unit_price_fcfa,
        subtotal_fcfa: item.unit_price_fcfa * item.quantity,
        options: item.options || [],
        groupage: !!item.groupage,
      })),
      total_amount: total,
      payment_method: selectedMethod,
      shipping_country: country,
      shipping_fee_fcfa: shippingFee,
    };

    const result = createOrderSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (path.startsWith("customer.")) {
          fieldErrors[path.replace("customer.", "")] = err.message;
        } else {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      track("add_payment_info", {
        payment_method: selectedMethod,
        currency: "XOF",
        value: total + shippingFee,
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Une erreur est survenue.");
        return;
      }

      // Paiement en ligne : redirection vers FedaPay (panier conservé).
      if (data.payment_url) {
        window.location.assign(data.payment_url);
        return;
      }

      // « Nous parler avant de payer » : redirection WhatsApp pré-remplie.
      if (data.whatsapp_url) {
        track("purchase", {
          order_id: data.order_id,
          value: total + shippingFee,
          currency: "XOF",
          num_items: items.length,
          payment_method: "talk_first",
          shipping_country: country,
          shipping_fee: shippingFee,
        });
        clearCart();
        window.location.assign(data.whatsapp_url);
        return;
      }

      // Cash à la livraison → redirection vers /confirmation (écran unifié).
      track("purchase", {
        order_id: data.order_id,
        value: total + shippingFee,
        currency: "XOF",
        num_items: items.length,
        payment_method: "cod",
        shipping_country: country,
        shipping_fee: shippingFee,
      });
      clearCart();
      router.push(`/confirmation?order=${data.order_id}`);
    } catch {
      setGlobalError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const nextLabel = selectedMethod === "cod"
    ? "Confirmer la commande"
    : selectedMethod === "talk_first"
      ? "Discuter sur WhatsApp"
      : isOnlinePayment(selectedMethod)
        ? "Payer en ligne"
        : "Choisir un mode de paiement";

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* ===== Logo centré ===== */}
      <header className="max-w-xl mx-auto px-4 pt-8 pb-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>
        <div className="flex justify-center">
          <Link href="/" className="font-display font-bold text-3xl tracking-tight text-[var(--color-text-primary)]">
            Imprim<span className="text-[var(--color-accent-amber)]">elle</span>
          </Link>
        </div>
      </header>

      {/* ===== Résumé de commande (total) — fond crème, encadré, sticky ===== */}
      <div className="sticky top-0 z-30 bg-[var(--color-bg-primary)] px-4 pb-4">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-cream)] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--color-accent-amber-soft)]/40 transition-colors md:pointer-events-none"
              aria-expanded={summaryOpen || isDesktop}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                <ShoppingCart className="w-4 h-4" />
                {isDesktop
                  ? "Résumé de la commande"
                  : summaryOpen
                    ? "Masquer le résumé"
                    : `Résumé (${itemCount} article${itemCount > 1 ? "s" : ""})`}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-[var(--color-text-primary)]">{formatPrice(total + shippingFee)}</span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform md:hidden ${summaryOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {/* Détails du résumé (toujours déplié sur desktop) */}
            {(summaryOpen || isDesktop) && (
              <div className="border-t border-[var(--color-border-default)]">
                <ul className="divide-y divide-[var(--color-border-default)] max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 p-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0">
                        {item.image_url ? (
                          <img src={imgProxyUrl(item.image_url, 60, 80)} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-0.5 flex items-center justify-center text-[10px] font-bold bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-bl-lg">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.product_name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.variant_label}</p>
                      </div>
                      <span className="text-sm font-mono text-[var(--color-text-primary)] shrink-0">
                        {formatPrice(item.unit_price_fcfa * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-3 space-y-1.5 bg-[var(--color-bg-secondary)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Sous-total</span>
                    <span className="font-mono text-[var(--color-text-primary)]">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Livraison ({country})</span>
                    <span className={shippingFee === 0 ? "text-[var(--color-success)]" : "text-[var(--color-text-primary)]"}>
                      {shippingFee === 0 ? "Gratuite" : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-[var(--color-border-default)]">
                    <span className="text-[var(--color-text-primary)]">Total</span>
                    <span className="font-mono">{formatPrice(total + shippingFee)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Formulaire : Contact → Livraison → Paiement ===== */}
      <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 pb-16">
        {globalError && (
          <div className="p-3 rounded-xl bg-[var(--color-error-soft)] text-[var(--color-error)] text-sm mb-4">{globalError}</div>
        )}

        {/* ===== SECTION CONTACT ===== */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-4">Contact</h2>
          <div className="space-y-4">
            <Input label="Téléphone" name="phone" required placeholder="+225 01 23 45 67" error={errors.phone} type="tel" autoComplete="tel" defaultValue={customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} />
            <Input label="Nom complet" name="name" required placeholder="Votre nom et prénom" error={errors.name} autoComplete="name" defaultValue={customer.name} onChange={(e) => setCustomer({ name: e.target.value })} />
          </div>
        </section>

        {/* ===== SECTION LIVRAISON ===== */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-4">Livraison</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Pays<span className="text-[var(--color-error)] ml-1">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCustomer({ country: e.target.value });
                }}
                className="w-full h-12 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)] focus:outline-none"
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              {shippingFee > 0 && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Livraison : {formatPrice(shippingFee)}</p>
              )}
            </div>
            <Input label="Adresse de livraison" name="address" required placeholder="Rue, immeuble, point de repère" error={errors.address} autoComplete="street-address" defaultValue={customer.address} onChange={(e) => setCustomer({ address: e.target.value })} />
          </div>
        </section>

        {/* ===== SECTION PAIEMENT ===== */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-4">Paiement</h2>
          {hasGroupage && (
            <div className="mb-3 rounded-xl border border-[var(--color-accent-amber)] bg-[var(--color-cream)] p-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Paiement groupage</p>
              {groupageBalance > 0 ? (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  <span className="font-semibold">{formatPrice(depositNow)}</span> maintenant ·{" "}
                  <span className="font-semibold">{formatPrice(groupageBalance)}</span> à la livraison
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Paiement total de <span className="font-semibold">{formatPrice(depositNow)}</span>
                </p>
              )}
            </div>
          )}
          <div className="space-y-3">
            {/* Payez en ligne (méthodes « live » uniquement) */}
            {allowsOnline && onlineEnabled && liveMethods.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Payez en ligne</p>
                <div className="grid grid-cols-4 gap-2">
                  {liveMethods.map((m) => {
                    const active = selectedMethod === m.id;
                    const style = METHOD_STYLE[m.id];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors ${
                          active
                            ? "border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]"
                            : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)]"
                        }`}
                      >
                        <span
                          className="w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: style.bg, color: style.fg }}
                        >
                          {style.short}
                        </span>
                        <span className="text-[10px] leading-tight text-center text-[var(--color-text-secondary)]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cash à la livraison */}
            {allowsCOD && (
              <button
                type="button"
                onClick={() => setSelectedMethod("cod")}
                className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  selectedMethod === "cod" ? "border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]" : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)]"
                }`}
              >
                <Banknote className="w-5 h-5 text-[var(--color-accent-amber)] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Cash à la livraison</span>
                  <span className="block text-xs text-[var(--color-text-tertiary)]">Espèces ou mobile money à la réception</span>
                </span>
              </button>
            )}

            {/* Nous parler avant de payer */}
            <button
              type="button"
              onClick={() => setSelectedMethod("talk_first")}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                selectedMethod === "talk_first" ? "border-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]" : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              <MessageCircle className="w-5 h-5 text-[#25D366] shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Nous parler avant de payer</span>
                <span className="block text-xs text-[var(--color-text-tertiary)]">On vous redirige vers WhatsApp pour convenir du paiement</span>
              </span>
            </button>
          </div>
        </section>

        {/* CGV */}
        <label className="flex items-start gap-2 cursor-pointer mb-4">
          <input type="checkbox" checked={acceptedCGV} onChange={(e) => setAcceptedCGV(e.target.checked)} className="mt-1" />
          <span className="text-xs text-[var(--color-text-secondary)]">
            J&apos;accepte les{" "}
            <Link href="/legal/cgv" target="_blank" className="text-[var(--color-accent-blue)] underline">conditions générales de vente</Link>{" "}
            et confirme que mes informations sont exactes.
          </span>
        </label>

        <Button variant="primary" size="lg" className="w-full" type="submit" disabled={loading || !selectedMethod}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={18} />
              Envoi en cours...
            </span>
          ) : (
            nextLabel
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-center text-[var(--color-text-tertiary)] mt-3">
          <Lock className="w-3.5 h-3.5" />
          Paiement sécurisé. Nous vous contacterons sous 24h.
        </p>
      </form>
    </div>
  );
}
