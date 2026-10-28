"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";

/**
 * Sélecteur de position pour la candidature point de vente.
 * Carte Leaflet (chargée côté client) + clic pour poser un marqueur
 * + bouton « Ma position GPS ». Émet la position via deux champs
 * cachés `lat`/`lng` lus par le formulaire parent (FormData).
 */
export function LocationPicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    (async () => {
      try {
        const leaflet = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !containerRef.current) return;

        const L = leaflet;
        leafletRef.current = L;

        map = L.map(containerRef.current, { scrollWheelZoom: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);
        map.setView([5.3599, -4.0083], 6);

        const icon = L.divIcon({
          className: "",
          html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FFA500;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        });

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          setPos({ lat, lng });
        });

        mapRef.current = map;
      } catch {
        /* Leaflet indisponible — le géocodage serveur prendra le relais */
      }
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        map = null;
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        const L = leafletRef.current;
        const map = mapRef.current;
        if (L && map) {
          if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
          else markerRef.current = L.marker([latitude, longitude]).addTo(map);
          map.setView([latitude, longitude], 15);
        }
        setPos({ lat: latitude, lng: longitude });
      },
      () => {
        /* refusé / indisponible */
      }
    );
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="lat" value={pos ? String(pos.lat) : ""} />
      <input type="hidden" name="lng" value={pos ? String(pos.lng) : ""} />
      <div
        ref={containerRef}
        className="h-52 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] overflow-hidden"
        aria-label="Choisir l'emplacement du point de vente"
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={geolocate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
        >
          <LocateFixed className="w-3.5 h-3.5" /> Ma position GPS
        </button>
        <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {pos ? "Position sélectionnée ✓" : "Cliquez sur la carte pour positionner votre point de vente"}
        </p>
      </div>
    </div>
  );
}
