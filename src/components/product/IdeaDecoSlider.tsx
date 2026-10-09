"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, ShoppingBag, X } from "lucide-react";
import { imgProxyUrl } from "@/lib/images";
import { useFormatPrice } from "@/stores/currency";
import type { IdeaDecoSlide } from "@/types";

/**
 * Slider « Idées décos » affiché en bas de fiche produit (après « Vous aimerez aussi »).
 * Cartes vidéo verticales 9:16 en défilement horizontal (snap), avec overlays interactifs :
 * — bouton « Produits » (bas-gauche) → bottom-sheet listant les produits de la vidéo ;
 * — bouton mute/audio (bas-droite) ;
 * — bouton lecture/plein écran (sous le mute).
 * Seule la carte visible (active) est lue automatiquement (muette, en boucle).
 */
export function IdeaDecoSlider({ videos }: { videos: IdeaDecoSlide[] }) {
  const [activeSheet, setActiveSheet] = useState<number | null>(null);

  if (!videos || videos.length === 0) return null;
  const openProducts = activeSheet != null ? videos[activeSheet]?.products || [] : [];

  return (
    <section className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* En-tête de section */}
        <div className="mb-5 md:mb-6">
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-amber)]">
            Idées décos
          </p>
          <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1.5">
            Trouvez l&apos;inspiration
          </h2>
        </div>

        {/* Piste défilante (laisse entrevoir la carte suivante) */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {videos.map((v, i) => (
            <IdeaDecoCard key={`${v.url}-${i}`} video={v} onShowProducts={() => setActiveSheet(i)} />
          ))}
        </div>
      </div>

      {/* Bottom-sheet des produits (même pattern que le panier) */}
      <AnimatePresence>
        {activeSheet != null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={() => setActiveSheet(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[60] max-h-[85vh] bg-[var(--color-surface-card)] rounded-t-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
                <h2 className="text-lg font-semibold font-display text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Produits
                  <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                    ({openProducts.length})
                  </span>
                </h2>
                <button
                  onClick={() => setActiveSheet(null)}
                  aria-label="Fermer"
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {openProducts.map((p) => (
                  <ProductRow key={p.slug} product={p} onNavigate={() => setActiveSheet(null)} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProductRow({
  product,
  onNavigate,
}: {
  product: { slug: string; name: string; image_url: string | null; price: number | null };
  onNavigate: () => void;
}) {
  const formatPrice = useFormatPrice();
  return (
    <Link
      href={`/collection/${product.slug}`}
      onClick={onNavigate}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgProxyUrl(product.image_url, 80, 107)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
            <ShoppingBag className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{product.name}</p>
        {product.price != null && (
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mt-0.5">
            À partir de {formatPrice(product.price)}
          </p>
        )}
      </div>
      <span className="text-xs font-semibold text-[var(--color-accent-blue)] shrink-0">Voir</span>
    </Link>
  );
}

function IdeaDecoCard({
  video,
  onShowProducts,
}: {
  video: IdeaDecoSlide;
  onShowProducts: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Lecture auto uniquement quand la carte est visible (au centre du slider).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // Synchronise l'état lecture + remet en muet à la sortie du plein écran.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onFs = () => {
      if (!document.fullscreenElement) {
        v.muted = true;
        setMuted(true);
      }
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement === v) {
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    } else if (v.requestFullscreen) {
      v.requestFullscreen();
      v.muted = false;
      setMuted(false);
      v.play().catch(() => {});
    } else {
      v.play().catch(() => {});
    }
  };

  return (
    <div className="relative snap-start shrink-0 w-[72vw] max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden bg-[var(--color-bg-tertiary)] shadow-sm">
      <video
        ref={videoRef}
        src={video.url}
        poster={video.poster || undefined}
        loop
        muted
        playsInline
        preload="metadata"
        onClick={toggleFullscreen}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Dégradé bas pour la lisibilité des contrôles */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

      {/* CTA principal : « Produits » (bas-gauche) */}
      {video.products.length > 0 && (
        <button
          type="button"
          onClick={onShowProducts}
          className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/95 text-[var(--color-text-primary)] text-sm font-semibold shadow-sm hover:bg-white transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Produits
        </button>
      )}

      {/* Contrôles empilés (bas-droite) : mute puis lecture/plein écran */}
      <div className="absolute right-3 bottom-3 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-[var(--color-text-primary)] shadow-sm hover:bg-white transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={playing ? "Mettre en pause" : "Lire en plein écran"}
          className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-[var(--color-text-primary)] shadow-sm hover:bg-white transition-colors"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
