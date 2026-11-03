"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFlyToCartStore, type FlyFlight } from "@/stores/fly-to-cart";

const SIZE = 56;

function FlyMiniature({ flight, onDone }: { flight: FlyFlight; onDone: () => void }) {
  const startCX = flight.startX + flight.startW / 2;
  const startCY = flight.startY + flight.startH / 2;
  const endCX = flight.endX + flight.endW / 2;
  const endCY = flight.endY + flight.endH / 2;
  const midX = (startCX + endCX) / 2;
  const midY = Math.min(startCY, endCY) - 120;

  return (
    <motion.img
      src={flight.imageUrl}
      alt=""
      aria-hidden="true"
      initial={{ x: startCX - SIZE / 2, y: startCY - SIZE / 2, scale: 1, opacity: 0.95 }}
      animate={{
        x: [startCX - SIZE / 2, midX - SIZE / 2, endCX - SIZE / 2],
        y: [startCY - SIZE / 2, midY - SIZE / 2, endCY - SIZE / 2],
        scale: [1, 0.6, 0.18],
        opacity: [0.95, 0.95, 0],
      }}
      transition={{ duration: 0.75, ease: "easeInOut" }}
      onAnimationComplete={onDone}
      className="fixed left-0 top-0 rounded-full object-cover shadow-xl ring-2 ring-white/70"
      style={{ width: SIZE, height: SIZE }}
    />
  );
}

/**
 * Couche globale (au-dessus de tout) qui anime les miniatures de produits
 * volant du point d'ajout vers l'icône panier de la navbar.
 */
export function FlyToCartLayer() {
  const flights = useFlyToCartStore((s) => s.flights);
  const remove = useFlyToCartStore((s) => s.remove);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <FlyMiniature key={f.id} flight={f} onDone={() => remove(f.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
