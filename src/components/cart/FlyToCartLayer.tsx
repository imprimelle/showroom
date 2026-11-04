"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFlyToCartStore, type FlyFlight } from "@/stores/fly-to-cart";

const SIZE = 56;

/** Petit paquet cadeau dessiné en CSS (boîte + ruban + nœud). */
function GiftBox() {
  return (
    <div
      className="relative w-full h-full"
      style={{ filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.35))" }}
    >
      {/* Corps (partie basse) */}
      <div className="absolute left-0 right-0 bottom-0 h-[68%] rounded-b-[6px] bg-gradient-to-b from-[#ef4444] to-[#b91c1c]" />
      {/* Ruban vertical (corps) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[68%] w-[17%] bg-amber-300" />
      {/* Couvercle */}
      <div className="absolute left-0 right-0 top-[3px] h-[32%] rounded-t-[7px] bg-gradient-to-b from-[#f87171] to-[#dc2626]" />
      {/* Ruban horizontal (couvercle) */}
      <div className="absolute left-0 right-0 top-[9px] h-[14%] bg-amber-300" />
      {/* Nœud */}
      <div className="absolute -top-[6px] left-1/2 -translate-x-1/2">
        <div className="relative w-[20px] h-[10px]">
          <span className="absolute left-0 top-0 w-[10px] h-[10px] rounded-full bg-amber-400 border border-amber-500" />
          <span className="absolute right-0 top-0 w-[10px] h-[10px] rounded-full bg-amber-400 border border-amber-500" />
          <span className="absolute left-1/2 -translate-x-1/2 top-[3px] w-[5px] h-[5px] rounded-full bg-amber-300" />
        </div>
      </div>
    </div>
  );
}

/**
 * Anime un cadeau 3D en 2 temps :
 *   1. apparition + rotation 3D sur le bouton d'ajout (0 → 0.42 s) ;
 *   2. envol vers l'icône panier avec réduction + fondu (0.42 → 1 s).
 */
function FlyGift({ flight, onDone }: { flight: FlyFlight; onDone: () => void }) {
  const startCX = flight.startX + flight.startW / 2;
  const startCY = flight.startY + flight.startH / 2;
  const endCX = flight.endX + flight.endW / 2;
  const endCY = flight.endY + flight.endH / 2;
  const midX = (startCX + endCX) / 2;
  const midY = Math.min(startCY, endCY) - 130;

  return (
    <motion.div
      initial={{
        x: startCX - SIZE / 2,
        y: startCY - SIZE / 2,
        scale: 0,
        rotateY: 0,
        opacity: 0,
      }}
      animate={{
        x: [
          startCX - SIZE / 2,
          startCX - SIZE / 2,
          startCX - SIZE / 2,
          startCX - SIZE / 2,
          midX - SIZE / 2,
          endCX - SIZE / 2,
        ],
        y: [
          startCY - SIZE / 2,
          startCY - SIZE / 2 - 8,
          startCY - SIZE / 2,
          startCY - SIZE / 2,
          midY - SIZE / 2,
          endCY - SIZE / 2,
        ],
        scale: [0, 1, 1.14, 1, 0.55, 0.16],
        rotateY: [0, 180, 360, 360, 360, 360],
        opacity: [0, 1, 1, 1, 1, 0],
      }}
      transition={{
        duration: 1.15,
        times: [0, 0.2, 0.3, 0.42, 0.68, 1],
        ease: "easeInOut",
      }}
      onAnimationComplete={onDone}
      className="fixed left-0 top-0"
      style={{ width: SIZE, height: SIZE, transformPerspective: 700 }}
    >
      <GiftBox />
    </motion.div>
  );
}

/**
 * Couche globale (au-dessus de tout) qui anime les cadeaux 3D volant
 * du point d'ajout vers l'icône panier de la navbar.
 */
export function FlyToCartLayer() {
  const flights = useFlyToCartStore((s) => s.flights);
  const remove = useFlyToCartStore((s) => s.remove);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <FlyGift key={f.id} flight={f} onDone={() => remove(f.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
