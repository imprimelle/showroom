"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Rotate3d, Ruler, MoveHorizontal, Maximize2, Play, Power } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { MediaRenderer } from "@/components/media/MediaRenderer";
import { MediaLightbox } from "@/components/product/MediaLightbox";
import { cn } from "@/lib/utils";
import { imgProxyUrl } from "@/lib/images";

interface MediaImage {
  url: string;
  alt: string;
}

interface MediaItem {
  type: "image" | "video";
  url: string;
  alt: string;
}

interface ProductMediaViewerProps {
  /** Toutes les images du produit (principale + galerie + variante), ordonnées. */
  images: MediaImage[];
  /** Image à afficher par défaut (image de la variante sélectionnée, sinon principale). */
  defaultImage?: string | null;
  videoUrl?: string | null;
  /** Vidéos de la galerie (hors vidéo héro) — affichées dans le carrousel et la lightbox. */
  galleryVideos?: MediaImage[];
  /** Cotes de la variante sélectionnée (champ libre, ex. « 120 × 80 × 5 cm »). */
  dimensions?: string | null;
  /** Séquence d'images de la vue 360° (configurée depuis l'admin). */
  images360?: string[];
  /** Active la vue 360°. */
  threeSixtyEnabled?: boolean;
  /** Switch allumé/éteint (image « allumé » vs « éteint », + map galerie). */
  lightSwitch?: {
    enabled?: boolean;
    image_on?: string | null;
    image_off?: string | null;
    gallery_off?: Record<string, string>;
  };
  productName?: string;
  /** Ref vers le bloc média (pour observer sa sortie de viewport → barre sticky). */
  mediaRef?: Ref<HTMLDivElement>;
}

type ViewMode = "photo" | "360" | "dimensions";

/* ===== Variants du carrousel d'images (swipe fluide, glissement directionnel) ===== */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

/* ===== Parsing des cotes (champ libre) ===== */
function parseDimensions(raw?: string | null) {
  if (!raw) return { numbers: [] as number[], unit: "", raw: "" };
  const numbers = (raw.match(/\d+(?:[.,]\d+)?/g) || []).map((n) =>
    parseFloat(n.replace(",", "."))
  );
  const unitMatch = raw.match(/\b(cm|mm|m)\b/i);
  const unit = unitMatch ? unitMatch[1].toLowerCase() : "";
  return { numbers, unit, raw };
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/* ===== Schéma technique isométrique (SVG, sans dépendance) ===== */
function DimensionSchema({ raw, productName }: { raw?: string | null; productName?: string }) {
  const { numbers, unit, raw: rawStr } = parseDimensions(raw);
  const u = unit || "cm";
  // Convention d'affichage a × b × c : a = longueur, b = profondeur, c = hauteur.
  const length = numbers[0]; // a — longueur
  const depth = numbers[1];  // b — profondeur
  const height = numbers[2]; // c — hauteur
  const fmt = (n?: number) => (n != null ? `${formatNum(n)} ${u}` : "—");

  // Géométrie isométrique
  const ox = 118, oy = 50; // sommet haut-arrière-gauche
  const W = 168, H = 150, DX = 70, DY = 34; // largeur / hauteur / profondeur (px)

  const A = [ox, oy]; //           haut arrière gauche
  const B = [ox + W, oy]; //       haut arrière droit
  const C = [ox + W + DX, oy + DY]; // haut avant droit
  const D = [ox + DX, oy + DY]; //   haut avant gauche
  const A2 = [ox, oy + H];
  const B2 = [ox + W, oy + H];
  const C2 = [ox + W + DX, oy + DY + H];
  const D2 = [ox + DX, oy + DY + H];

  const pts = (p: number[]) => p.join(",");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 400 320"
        className="w-full max-w-[360px] h-auto"
        role="img"
        aria-label={`Schéma technique avec cotes — ${productName || "produit"}`}
      >
        <defs>
          <marker id="dim-arr-h" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFA500" />
          </marker>
          <marker id="dim-arr-l" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563EB" />
          </marker>
          <marker id="dim-arr-p" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7280" />
          </marker>
        </defs>

        {/* Faces du pavé isométrique */}
        <polygon points={pts(A) + " " + pts(B) + " " + pts(C) + " " + pts(D)} fill="#F6F1EA" stroke="#D1CCC4" strokeWidth="1.5" />
        <polygon points={pts(B) + " " + pts(C) + " " + pts(C2) + " " + pts(B2)} fill="#EDE8E2" stroke="#D1CCC4" strokeWidth="1.5" />
        <polygon points={pts(A) + " " + pts(D) + " " + pts(D2) + " " + pts(A2)} fill="#E5DED4" stroke="#D1CCC4" strokeWidth="1.5" />

        {/* Ligne de cote — Hauteur (c, verticale, à gauche) */}
        <line
          x1={ox - 30} y1={oy} x2={ox - 30} y2={oy + H}
          stroke="#FFA500" strokeWidth="1.5"
          markerStart="url(#dim-arr-h)" markerEnd="url(#dim-arr-h)"
        />
        <text x={ox - 40} y={oy + H / 2} textAnchor="end" fontSize="13" fontWeight="700" fill="#111827">
          c
        </text>
        <text x={ox - 40} y={oy + H / 2 + 16} textAnchor="end" fontSize="12" fill="#4B5563">
          {fmt(height)}
        </text>

        {/* Ligne de cote — Longueur (a, horizontale, sous l'arête avant) */}
        <line
          x1={ox + DX} y1={oy + DY + H + 34} x2={ox + W + DX} y2={oy + DY + H + 34}
          stroke="#2563EB" strokeWidth="1.5"
          markerStart="url(#dim-arr-l)" markerEnd="url(#dim-arr-l)"
        />
        <text x={(ox + DX + ox + W + DX) / 2} y={oy + DY + H + 24} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
          a
        </text>
        <text x={(ox + DX + ox + W + DX) / 2} y={oy + DY + H + 54} textAnchor="middle" fontSize="12" fill="#4B5563">
          {fmt(length)}
        </text>

        {/* Ligne de cote — Profondeur (b, diagonale, sous l'arête inférieure gauche) */}
        <line
          x1={ox} y1={oy + H + 46} x2={ox + DX} y2={oy + DY + H + 46}
          stroke="#6B7280" strokeWidth="1.5"
          markerStart="url(#dim-arr-p)" markerEnd="url(#dim-arr-p)"
        />
        <text x={ox + DX / 2 - 6} y={oy + DY + H + 34} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
          b
        </text>
        <text x={ox + DX / 2 - 6} y={oy + DY + H + 68} textAnchor="middle" fontSize="12" fill="#4B5563">
          {fmt(depth)}
        </text>
      </svg>

      {/* Légende + cote brute */}
      <div className="mt-2 w-full max-w-[360px] space-y-1.5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[11px] text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" /> a · Longueur
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#6B7280]" /> b · Profondeur
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#FFA500]" /> c · Hauteur
          </span>
        </div>
        {rawStr ? (
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            {rawStr}
          </p>
        ) : (
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            Dimensions sur mesure — contactez-nous pour un devis.
          </p>
        )}
      </div>
    </div>
  );
}

export function ProductMediaViewer({
  images,
  defaultImage,
  videoUrl,
  galleryVideos,
  dimensions,
  images360,
  threeSixtyEnabled,
  lightSwitch,
  productName,
  mediaRef,
}: ProductMediaViewerProps) {
  const [view, setView] = useState<ViewMode>("photo");

  // ===== Switch allumé/éteint (bascule entre l'image « allumé » et « éteint ») =====
  const [isOn, setIsOn] = useState(true);

  // ===== Liste unifiée des médias (photos + vidéos), dans l'ordre d'affichage du carrousel =====
  const media = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    if (videoUrl) items.push({ type: "video", url: videoUrl, alt: productName || "" });
    images.forEach((img) => items.push({ type: "image", url: img.url, alt: img.alt }));
    (galleryVideos || []).forEach((v) => items.push({ type: "video", url: v.url, alt: v.alt }));
    return items;
  }, [videoUrl, images, galleryVideos, productName]);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = defaultImage ? media.findIndex((i) => i.url === defaultImage) : 0;
    return idx >= 0 ? idx : 0;
  });

  // Réinitialise le média actif uniquement quand la variante change (donc `defaultImage`),
  // pour ne pas perdre la miniature choisie lors des autres re-rendus du parent.
  useEffect(() => {
    const idx = defaultImage ? media.findIndex((i) => i.url === defaultImage) : 0;
    setActiveIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultImage]);

  const activeItem = media[activeIndex] || null;
  const hasMultipleItems = media.length > 1;

  // Le switch s'applique au 1er slide (paire image_on/image_off) et à toute photo de la
  // galerie ayant une image « éteint » associée (map gallery_off).
  const switchEnabled = !!lightSwitch?.enabled;
  const mainOnUrl = lightSwitch?.image_on || "";
  const mainOffUrl = lightSwitch?.image_off || "";
  const galleryOffMap = lightSwitch?.gallery_off || {};
  const isMainSlide = activeIndex === 0;
  const switchOnUrl = isMainSlide ? mainOnUrl : (activeItem?.url || "");
  const switchOffUrl = isMainSlide
    ? mainOffUrl
    : activeItem
      ? (galleryOffMap[activeItem.url] || "")
      : "";
  const showSwitch = switchEnabled && !!switchOnUrl && !!switchOffUrl;

  // ===== Lightbox (galerie bottom-sheet : photos + vidéos) =====
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = () => {
    if (media.length === 0) return;
    setLightboxIndex(activeIndex);
    setLightboxOpen(true);
  };

  // ===== Swipe fluide entre les médias — vue « photo » uniquement =====
  const [direction, setDirection] = useState(0);
  const canSwipe = view === "photo" && hasMultipleItems;
  const didDragRef = useRef(false);

  const paginate = (dir: number) => {
    setDirection(dir);
    setActiveIndex((i) => Math.min(media.length - 1, Math.max(0, i + dir)));
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (!canSwipe) return;
    didDragRef.current = true;
    const threshold = 80;
    if (info.offset.x < -threshold || info.velocity.x < -500) paginate(1);
    else if (info.offset.x > threshold || info.velocity.x > 500) paginate(-1);
    // Réinitialise le drapeau après l'éventuel clic consécutif au drag, pour ne pas
    // « manger » le premier tap suivant (fix : 1er clic après un slide restait inactif).
    setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const onPhotoClick = () => {
    // Un geste de swipe ne doit déclencher ni le toggle ni la lightbox.
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    // En mode switch, un clic bascule allumé/éteint (pas de lightbox).
    if (showSwitch) {
      setIsOn((v) => !v);
      return;
    }
    openLightbox();
  };

  // ===== Vue 360° (turntable type Cozey) : frames dédiées + drag-to-spin =====
  const frames360 = (images360 || []).map((url) => ({ url, alt: productName || "produit" }));
  const has360 = !!threeSixtyEnabled && frames360.length > 0;
  const [frameIndex, setFrameIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startFrame: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0, // frames / ms
  });
  const rafRef = useRef<number | null>(null);

  // Précharge les frames 360° en arrière-plan pour un rendu instantané.
  useEffect(() => {
    if (!threeSixtyEnabled) return;
    (images360 || []).forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [threeSixtyEnabled, images360]);

  // ~ un tour complet (360°) correspond à ~320px de glissement, quel que soit le nb de frames.
  const pxPerFrame = Math.max(3, 320 / Math.max(1, frames360.length));

  const normalizeFrame = (f: number) =>
    ((f % frames360.length) + frames360.length) % frames360.length;

  const applyFrame = (f: number) => setFrameIndex(normalizeFrame(f));

  const onSpinPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (frames360.length <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startFrame: frameIndex,
      lastX: e.clientX,
      lastT: now,
      velocity: 0,
    };
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setInteracted(true);
  };

  const onSpinPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.dragging || frames360.length <= 1) return;
    const frameDelta = Math.round((e.clientX - d.startX) / pxPerFrame);
    applyFrame(d.startFrame + frameDelta);

    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) {
      const df = (e.clientX - d.lastX) / pxPerFrame;
      d.velocity = d.velocity * 0.6 + (df / dt) * 0.4;
    }
    d.lastX = e.clientX;
    d.lastT = now;
  };

  const onSpinPointerUp = () => {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    if (Math.abs(d.velocity) > 0.03) startSpinInertia();
  };

  const startSpinInertia = () => {
    const tick = () => {
      const d = dragRef.current;
      const step = Math.round(d.velocity * 16);
      if (step !== 0) setFrameIndex((prev) => normalizeFrame(prev + step));
      d.velocity *= 0.95;
      if (Math.abs(d.velocity) < 0.005) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div ref={mediaRef} className="md:sticky md:top-32 md:self-start">
      {/* ===== Zone d'affichage principale (pleine largeur, image non arrondie) ===== */}
      <div className="relative overflow-hidden bg-[var(--color-bg-tertiary)] aspect-[3/4] w-full">
        {/* ===== Vue Photo ===== */}
        {view === "photo" && (
          <>
            {showSwitch || activeItem ? (
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 320, damping: 32 },
                    opacity: { duration: 0.18 },
                  }}
                  drag={canSwipe ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={onDragEnd}
                  style={{ touchAction: "pan-y" }}
                  className="absolute inset-0 select-none"
                >
                  {showSwitch ? (
                    /* Réveal : l'image « allumé » se fond au-dessus de l'image « éteint » */
                    <div className="relative h-full w-full cursor-pointer" onClick={onPhotoClick}>
                      <img
                        src={imgProxyUrl(switchOffUrl, 1200, 1600)}
                        alt={`${productName || "produit"} — éteint`}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                      <motion.img
                        src={imgProxyUrl(switchOnUrl, 1200, 1600)}
                        alt={`${productName || "produit"} — allumé`}
                        initial={false}
                        animate={{ opacity: isOn ? 1 : 0 }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full cursor-zoom-in" onClick={onPhotoClick}>
                      <MediaRenderer
                        url={activeItem.url}
                        type={activeItem.type}
                        posterUrl={activeItem.type === "video" ? images[0]?.url || undefined : undefined}
                        imgWidth={1200}
                        imgHeight={1600}
                        className="pointer-events-none w-full h-full object-cover"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#3A3A3A] via-[#1F2937] to-[#111827] flex items-center justify-center">
                <div className="text-center text-white/70">
                  <span className="text-4xl">✨</span>
                  <p className="text-sm mt-2">Photo à venir</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== Switch allumé/éteint (discret, position de l'icône galerie) ===== */}
        {view === "photo" && showSwitch && (
          <motion.button
            key={activeIndex}
            type="button"
            onClick={() => setIsOn((v) => !v)}
            aria-pressed={isOn}
            aria-label={isOn ? "Éteindre" : "Allumer"}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white",
              isOn
                ? "bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                : "switch-glow"
            )}
          >
            <Power className="h-3.5 w-3.5" />
            {isOn ? "Éteindre" : "Allumer"}
          </motion.button>
        )}

        {/* ===== Vue 360° : drag-to-spin horizontal (turntable) ===== */}
        {view === "360" && has360 && (
          <div
            className="absolute inset-0 touch-pan-y select-none cursor-grab active:cursor-grabbing"
            onPointerDown={onSpinPointerDown}
            onPointerMove={onSpinPointerMove}
            onPointerUp={onSpinPointerUp}
            onPointerCancel={onSpinPointerUp}
            role="application"
            aria-label="Vue 360° — glissez horizontalement pour faire tourner le produit"
          >
            <img
              src={frames360[frameIndex].url}
              alt={`${productName || "produit"} — vue 360°`}
              className="pointer-events-none h-full w-full object-cover"
              draggable={false}
            />

            {/* Indice (disparaît après la première interaction) */}
            {!interacted && (
              <div className="pointer-events-none absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white">
                <MoveHorizontal className="h-3.5 w-3.5" />
                Glissez pour faire tourner
              </div>
            )}
          </div>
        )}

        {/* ===== Vue Dimensions ===== */}
        {view === "dimensions" && (
          <div className="w-full h-full flex items-center justify-center px-4 pb-16 pt-6">
            <DimensionSchema raw={dimensions} productName={productName} />
          </div>
        )}

        {/* ===== Bouton agrandir (lightbox plein écran) ===== */}
        {view === "photo" && media.length > 0 && !showSwitch && (
          <button
            type="button"
            onClick={openLightbox}
            aria-label="Ouvrir la galerie plein écran"
            className="absolute top-3 right-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* ===== Bandeau outils collé au bas de l'image (miniatures + 360° + Dimensions, même aspect) ===== */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="flex items-center gap-2 bg-gradient-to-t from-black/55 to-black/10 px-3 pb-3 pt-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Miniatures des médias (même aspect que les boutons) */}
              {hasMultipleItems &&
                media.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setView("photo"); setActiveIndex(i); }}
                    aria-label={`Média ${i + 1}`}
                    className={cn(
                      "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                      view === "photo" && i === activeIndex
                        ? "border-white opacity-100"
                        : "border-white/30 opacity-80 hover:opacity-100"
                    )}
                  >
                    {item.type === "video" ? (
                      <span className="relative block h-full w-full bg-black/60">
                        <video src={item.url} muted preload="metadata" playsInline className="h-full w-full object-cover pointer-events-none" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white drop-shadow" />
                        </span>
                      </span>
                    ) : (
                      <img src={item.url} alt={item.alt} className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}

              {hasMultipleItems && <span className="mx-0.5 h-6 w-px shrink-0 bg-white/25" />}

              {/* Bouton 360° (affiché uniquement si la vue est activée + frames configurées) */}
              {has360 && (
                <button
                  type="button"
                  onClick={() => setView(view === "360" ? "photo" : "360")}
                  aria-pressed={view === "360"}
                  aria-label="Vue 360°"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    view === "360" ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"
                  )}
                >
                  <Rotate3d className="h-5 w-5" />
                </button>
              )}

              {/* Bouton Dimensions */}
              <button
                type="button"
                onClick={() => setView(view === "dimensions" ? "photo" : "dimensions")}
                aria-pressed={view === "dimensions"}
                aria-label="Vue dimensions"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  view === "dimensions" ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <Ruler className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <MediaLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={media}
        initialIndex={lightboxIndex}
        productName={productName}
      />
    </div>
  );
}
