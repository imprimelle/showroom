"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicStore } from "@/types";

/**
 * Carte des points de vente partenaires (Leaflet + tuiles OSM).
 * Chargée côté client uniquement (`ssr:false` via next/dynamic dans le parent).
 * Aucune clé API requise.
 */

interface StoresMapProps {
  stores: PublicStore[];
}

export default function StoresMap({ stores }: StoresMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    let L: any = null;

    (async () => {
      try {
        // Import dynamique de Leaflet (SSR-safe).
        const leaflet = await import("leaflet");
        L = leaflet;
        // Le CSS Leaflet est importé ici (côté client).
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !containerRef.current) return;

        // Centre par défaut : Abidjan, Côte d'Ivoire.
        const bounds = L.latLngBounds([]);
        let hasPoints = false;
        for (const s of stores) {
          if (s.lat != null && s.lng != null) {
            bounds.extend([Number(s.lat), Number(s.lng)]);
            hasPoints = true;
          }
        }

        map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        if (hasPoints) {
          map.fitBounds(bounds.pad(0.35), { maxZoom: 12 });
        } else {
          map.setView([5.3599, -4.0083], 6);
        }

        // Icône par défaut Leaflet (les assets par défaut ne se résolvent pas
        // bien en bundler — on fournit un divIcon simple et robuste).
        const icon = L.divIcon({
          className: "",
          html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FFA500;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        for (const s of stores) {
          if (s.lat == null || s.lng == null) continue;
          const marker = L.marker([Number(s.lat), Number(s.lng)], { icon }).addTo(map);
          const parts = [s.city, s.address].filter(Boolean).join(" — ");
          marker.bindPopup(
            `<strong>${s.name}</strong>${parts ? `<br/>${parts}` : ""}` +
              (s.website ? `<br/><a href="${s.website}" target="_blank" rel="noopener">Site web</a>` : "")
          );
        }

        mapRef.current = map;
        setReady(true);
      } catch {
        /* Leaflet indisponible — la liste textuelle reste affichée */
      }
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      }
      mapRef.current = null;
    };
  }, [stores]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] md:h-[440px] w-full rounded-2xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-bg-tertiary)]"
      aria-label="Carte des points de vente partenaires"
    />
  );
}
