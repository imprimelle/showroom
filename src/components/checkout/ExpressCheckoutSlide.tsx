"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Banknote,
  MessageCircle,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useCheckoutStore } from "@/stores/checkout";
import { useFormatPrice, useCurrencyStore } from "@/stores/currency";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { imgProxyUrl } from "@/lib/images";
import { track } from "@/lib/analytics";
import { COUNTRIES } from "@/lib/countries";
import { DEFAULT_SHIPPING_ZONES, shippingFeeForCountry, type ShippingZone } from "@/lib/shipping";
import {
  DEFAULT_ONLINE_METHODS,
  type OnlineMethodDef,
} from "@/lib/payment";
import { computeDepositBalance } from "@/lib/groupage";
import { createOrderSchema } from "@/schemas/order";
import { cn } from "@/lib/utils";
import type { PaymentMethod, OnlinePaymentMethod } from "@/types";

const METHOD_STYLE: Record<OnlinePaymentMethod, { bg: string; fg: string; short: string }> = {
  orange: { bg: "#FF7900", fg: "#ffffff", short: "OM" },
  mtn: { bg: "#FFCB05", fg: "#000000", short: "MTN" },
  wave: { bg: "#1DC9FF", fg: "#00243B", short: "Wave" },
  card: { bg: "#1A1F71", fg: "#ffffff", short: "VISA" },
};

const STEPS = [
  { label: "Panier" },
  { label: "Contact" },
  { label: "Livraison" },
  { label: "Paiement" },
];

/** Dégradé « groupage » réutilisé pour la barre de progression. */
const STEP_GRADIENT = "linear-gradient(90deg, #FFA500, #F97316, #F59E0B, #22C55E, #0EA5E9)";

/** Validation simple du numéro (cohérente avec le schéma Zod côté serveur). */
function isValidPhone(phone: string): boolean {
  return /^\+?[0-9\s\-().]{6,20}$/.test(phone.trim());
}

export function ExpressCheckoutSlide() {
  const router = useRouter();
  const formatPrice = useFormatPrice();
  const detectedCountry = useCurrencyStore((s) => s.country);

  const { items, getTotal, clearCart, updateQuantity } = useCartStore();
  const { isOpen, step, customer, close, next, prev, setStep, setCustomer } =
    useCheckoutStore();

  const total = getTotal();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>(DEFAULT_SHIPPING_ZONES);
  const [paymentMethods, setPaymentMethods] = useState<OnlineMethodDef[]>(DEFAULT_ONLINE_METHODS);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  // Bon de commande dépliable : ouvert à l'étape « Panier », replié ensuite.
  const [summaryOpen, setSummaryOpen] = useState(true);

  const country = customer.country || "CI";
  const shippingFee = shippingFeeForCountry(country, { zones });

  // === Groupage : répartition montant de départ / solde (affichage) ===
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

  const allowsCOD = !hasGroupage && items.every((i) => i.cash_on_delivery === true);
  const allowsOnline = items.every((i) => i.groupage || i.online_enabled === true);
  const liveMethods = paymentMethods.filter((m) => m.live);

  // Verrouille le scroll quand le slide est ouvert.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Charge zones + méthodes de paiement + état FedaPay.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (Array.isArray(d?.zones) && d.zones.length > 0) setZones(d.zones);
        if (Array.isArray(d?.payment_methods) && d.payment_methods.length > 0)
          setPaymentMethods(d.payment_methods);
        setOnlineEnabled(d?.online_payment_enabled !== false);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Pré-remplit le pays (détection devise) la première fois.
  useEffect(() => {
    if (!isOpen) return;
    if (!customer.country) {
      const d = (detectedCountry || "").toUpperCase();
      setCustomer({ country: COUNTRIES.some((c) => c.code === d) ? d : "CI" });
    }
  }, [isOpen, detectedCountry, customer.country, setCustomer]);

  // Pré-sélectionne le mode de paiement le plus adapté (CTA jamais grisé).
  useEffect(() => {
    if (!isOpen || selectedMethod) return;
    // Le groupage exige un acompte en ligne ; sinon privilégier le cash.
    setSelectedMethod(allowsCOD ? "cod" : "talk_first");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allowsCOD]);

  // Tracking begin_checkout à l'ouverture (panier non vide).
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    track("begin_checkout", { value: total, num_items: items.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Replie le bon de commande dès qu'on quitte l'étape « Panier ».
  useEffect(() => {
    setSummaryOpen(step === 0);
  }, [step]);

  const handleClose = () => {
    if (loading) return;
    close();
  };

  // Valide les champs de l'étape COURANTE avant de passer à la suivante.
  const validateStep = (current: number): boolean => {
    setErrors({});
    if (current === 1) {
      const e: Record<string, string> = {};
      if (!customer.phone || !isValidPhone(customer.phone)) e.phone = "Numéro invalide";
      if (!customer.name || customer.name.trim().length < 2) e.name = "Nom requis (2 caractères min)";
      setErrors(e);
      return Object.keys(e).length === 0;
    }
    if (current === 2) {
      const e: Record<string, string> = {};
      if (!customer.address || customer.address.trim().length < 5)
        e.address = "Adresse requise (5 caractères min)";
      setErrors(e);
      return Object.keys(e).length === 0;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) next();
  };

  const submitOrder = async () => {
    setGlobalError("");
    if (!selectedMethod) {
      setGlobalError("Choisissez un mode de paiement.");
      return;
    }
    if (!acceptedCGV) {
      setGlobalError("Veuillez accepter les conditions générales de vente.");
      return;
    }

    const payload = {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
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
        if (path.startsWith("customer.")) fieldErrors[path.replace("customer.", "")] = err.message;
        else fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      // Ramène à l'étape pertinente si erreur client.
      if (fieldErrors.phone || fieldErrors.name) setStep(1);
      else if (fieldErrors.address) setStep(2);
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

      if (data.payment_url) {
        window.location.assign(data.payment_url);
        return;
      }

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
        close();
        window.location.assign(data.whatsapp_url);
        return;
      }

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
      close();
      router.push(`/confirmation?order=${data.order_id}`);
    } catch {
      setGlobalError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const nextLabel = step === 3
    ? loading
      ? "Envoi en cours..."
      : selectedMethod === "cod"
        ? "Confirmer la commande"
        : selectedMethod === "talk_first"
          ? "Discuter sur WhatsApp"
          : "Payer en ligne"
    : step === 0
      ? "Commander"
      : "Continuer";

  // Panier vidé pendant que le slide est ouvert → état vide.
  const empty = items.length === 0;

  // Libellé du bon de commande replié : « [dernier produit] et X autres ».
  const lastItem = items[items.length - 1];
  const collapsedLabel = !lastItem
    ? "Bon de commande"
    : items.length === 1
      ? lastItem.product_name
      : `${lastItem.product_name} et ${items.length - 1} autre${items.length - 1 > 1 ? "s" : ""}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-h-[92vh] flex flex-col overflow-hidden bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl rounded-t-2xl md:left-auto md:w-[460px] md:rounded-none md:rounded-l-2xl md:bottom-0 md:top-0 md:max-h-full"
          >
            {/* Poignée mobile */}
            <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
              <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" />
            </div>

            {/* Header : titre + bon de commande + progression */}
            <div className="border-b border-[var(--color-border-default)] shrink-0">
              <div className="flex items-center justify-between px-4 py-2">
                <h2 className="text-lg font-semibold font-display text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Commander
                </h2>
                <button
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bon de commande (au-dessus de la barre de progression) */}
              <div className="px-4 pb-2">
                <div className="overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]">
                  <button
                    type="button"
                    onClick={() => setSummaryOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5"
                    aria-expanded={summaryOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                      <ShoppingCart className="h-4 w-4 shrink-0" />
                      <span className="truncate">{collapsedLabel}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono font-bold text-[var(--color-text-primary)]">
                        {formatPrice(total + shippingFee)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--color-text-tertiary)] transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>

                  {summaryOpen && (
                    <div className="border-t border-[var(--color-border-default)]">
                      <ul className="max-h-44 divide-y divide-[var(--color-border-default)] overflow-y-auto">
                        {items.map((item) => (
                          <li key={item.key} className="flex items-center gap-3 px-3 py-3">
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0">
                              {item.image_url ? (
                                <img src={imgProxyUrl(item.image_url, 80, 107)} alt={item.product_name} className="w-full h-full object-cover" />
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
                              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)] truncate">{item.variant_label}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <span className="text-sm font-mono font-semibold text-[var(--color-text-primary)] shrink-0">
                              {formatPrice(item.unit_price_fcfa * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {hasGroupage && groupageBalance > 0 && (
                        <div className="border-t border-[var(--color-border-default)] bg-[var(--color-cream)] px-3 py-3">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Paiement groupage</p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            <span className="font-semibold">{formatPrice(depositNow)}</span> maintenant ·{" "}
                            <span className="font-semibold">{formatPrice(groupageBalance)}</span> à la livraison
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-secondary)]">Sous-total</span>
                          <span className="font-mono text-[var(--color-text-primary)]">{formatPrice(total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-secondary)]">Livraison</span>
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

              {/* Barre de progression numérotée */}
              <div className="px-4 pb-3">
                <div className="flex items-start">
                  {STEPS.map((s, i) => {
                    const completed = i < step;
                    const current = i === step;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <div
                        key={s.label}
                        className="flex items-start"
                        style={{ flex: isLast ? "0 0 auto" : "1 1 0%" }}
                      >
                        {/* Nœud : pastille numérotée + libellé */}
                        <div className="flex w-11 shrink-0 flex-col items-center gap-1">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300",
                              completed
                                ? "text-white shadow-sm"
                                : current
                                  ? "text-white shadow-md ring-2 ring-[var(--color-accent-amber)] ring-offset-1"
                                  : "border border-[var(--color-border-strong)] text-[var(--color-text-tertiary)]"
                            )}
                            style={
                              completed
                                ? { background: STEP_GRADIENT }
                                : current
                                  ? { background: "var(--color-accent-amber)" }
                                  : undefined
                            }
                          >
                            {completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                          </div>
                          <span
                            className={cn(
                              "whitespace-nowrap text-[10px] leading-none",
                              current
                                ? "font-bold text-[var(--color-accent-amber)]"
                                : completed
                                  ? "font-semibold text-[var(--color-text-primary)]"
                                  : "text-[var(--color-text-tertiary)]"
                            )}
                          >
                            {s.label}
                          </span>
                        </div>

                        {/* Connecteur animé vers l'étape suivante */}
                        {!isLast && (
                          <div className="relative mt-[13px] h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--color-border-strong)]">
                            <motion.div
                              className="h-full"
                              style={{ background: STEP_GRADIENT }}
                              initial={false}
                              animate={{ width: completed ? "100%" : "0%" }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                            {completed && (
                              <motion.span
                                className="absolute inset-y-0 w-8 bg-white/40 blur-[2px]"
                                animate={{ x: ["-150%", "450%"] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {empty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingCart className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" />
                  <p className="text-xl font-semibold text-[var(--color-text-secondary)]">Votre panier est vide</p>
                  <Button variant="primary" size="md" className="mt-6" onClick={handleClose}>
                    Continuer mes achats
                  </Button>
                </div>
              ) : (
                <>
                  {globalError && (
                    <div className="p-3 rounded-xl bg-[var(--color-error-soft)] text-[var(--color-error)] text-sm mb-4">
                      {globalError}
                    </div>
                  )}

                  {/* === Étape 0 — Récap (le bon de commande est déplié dans le header) === */}
                  {step === 0 && (
                    <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                      Vérifiez votre commande, puis continuez.
                    </p>
                  )}

                  {/* === Étape 1 — Contact === */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Vos coordonnées</p>
                      <Input
                        label="Téléphone"
                        name="phone"
                        required
                        type="tel"
                        autoComplete="tel"
                        placeholder="+225 01 23 45 67"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ phone: e.target.value })}
                        error={errors.phone}
                        autoFocus
                      />
                      <Input
                        label="Nom complet"
                        name="name"
                        required
                        autoComplete="name"
                        placeholder="Votre nom et prénom"
                        value={customer.name}
                        onChange={(e) => setCustomer({ name: e.target.value })}
                        error={errors.name}
                      />
                    </div>
                  )}

                  {/* === Étape 2 — Livraison === */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Livraison</p>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                          Pays<span className="text-[var(--color-error)] ml-1">*</span>
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCustomer({ country: e.target.value })}
                          className="w-full h-12 px-3.5 text-base rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-blue)] focus:ring-[3px] focus:ring-[rgba(37,99,235,0.15)] focus:outline-none"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                        {shippingFee > 0 && (
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Livraison : {formatPrice(shippingFee)}</p>
                        )}
                      </div>
                      <Input
                        label="Adresse de livraison"
                        name="address"
                        required
                        autoComplete="street-address"
                        placeholder="Rue, immeuble, point de repère"
                        value={customer.address}
                        onChange={(e) => setCustomer({ address: e.target.value })}
                        error={errors.address}
                      />
                    </div>
                  )}

                  {/* === Étape 3 — Paiement === */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Mode de paiement</p>

                      {hasGroupage && (
                        <div className="rounded-xl border border-[var(--color-accent-amber)] bg-[var(--color-cream)] p-3">
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
                        {/* Paiement en ligne (méthodes live uniquement) */}
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
                            {selectedMethod === "cod" && <Check className="w-5 h-5 text-[var(--color-text-primary)] shrink-0" />}
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
                            <span className="block text-xs text-[var(--color-text-tertiary)]">Redirection WhatsApp pour convenir du paiement</span>
                          </span>
                          {selectedMethod === "talk_first" && <Check className="w-5 h-5 text-[var(--color-text-primary)] shrink-0" />}
                        </button>
                      </div>

                      {/* CGV */}
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptedCGV}
                          onChange={(e) => setAcceptedCGV(e.target.checked)}
                          className="mt-1"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          J&apos;accepte les{" "}
                          <a href="/legal/cgv" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-blue)] underline">
                            conditions générales de vente
                          </a>{" "}
                          et confirme que mes informations sont exactes.
                        </span>
                      </label>

                      <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                        <Lock className="w-3.5 h-3.5" />
                        Paiement sécurisé. Contact sous 24h.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer : navigation / CTA */}
            {!empty && (
              <div className="border-t border-[var(--color-border-default)] px-4 py-4 shrink-0 safe-bottom">
                {step < 3 ? (
                  <div className="flex items-center gap-3">
                    {step > 0 && (
                      <Button variant="secondary" size="lg" className="px-5" onClick={prev}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                    )}
                    <Button variant="primary" size="lg" className="flex-1" onClick={handleNext}>
                      {nextLabel}
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="success"
                    size="lg"
                    className="w-full"
                    type="button"
                    disabled={loading}
                    onClick={submitOrder}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner size={18} />
                        Envoi en cours...
                      </span>
                    ) : (
                      nextLabel
                    )}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
