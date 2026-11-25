"use client";
import { useEffect, useRef } from "react";
import { imgProxyUrl } from "@/lib/images";
import { isVideoUrl } from "@/lib/utils";

interface MediaRendererProps {
  url: string;
  alt?: string;
  /** Force le type. Sinon auto-détecté depuis l'URL. */
  type?: "image" | "video";
  /** Classes appliquées à l'<img> ou <video>. */
  className?: string;
  /** Poster (image) pour la vidéo. URL Supabase → passée par imgProxy (webp léger). */
  posterUrl?: string;
  autoPlay?: boolean;
  /** Largeur de l'image pour imgProxy (images uniquement). */
  imgWidth?: number;
  /** Hauteur cible (ratio). À fournir pour éviter la déformation (resize=cover). */
  imgHeight?: number;
  /** `loading` natif de l'<img> (default "lazy"). Passer "eager" pour le LCP. */
  loading?: "lazy" | "eager";
  /** `fetchPriority` de l'<img> (\"high\" pour l'image héro). */
  fetchPriority?: "high" | "low" | "auto";
  /** `preload` natif de la <video> (default \"none\" — ne télécharge pas avant lecture). */
  videoPreload?: "none" | "metadata" | "auto";
  /** Attribut `sizes` (ex. \"100vw\") → active le `srcset` responsif sur les images. */
  sizes?: string;
  /**
   * Ne lancer la lecture que lorsque la vidéo entre dans le viewport (IntersectionObserver).
   * Combiné à `preload=\"none\"`, une vidéo hors écran ne coûte **aucun octet**.
   * Le poster reste affiché tant que le premier frame n'est pas décodé (pas de flash noir).
   */
  playInView?: boolean;
}

/** Une vidéo en cours de chargement reste immobile si l'utilisateur préfère économiser les données. */
function shouldDeferVideo(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return true;
  return false;
}

/**
 * Rendu d'un média (image ou vidéo) selon le type détecté.
 * Image → imgProxyUrl (webp redimensionné). Vidéo → <video> autoplay/muted/loop.
 *
 * Optimisations de chargement (vidéos) :
 *  - `poster` : 1re frame WebP (~70 Ko) affichée instantanément → plus d'écran noir ;
 *  - `playInView` : la vidéo ne se télécharge qu'à l'entrée dans le viewport ;
 *  - fondu du poster à la lecture réelle (`playing`) ;
 *  - `prefers-reduced-data` / `saveData` / 2G → poster seul, pas de vidéo.
 */
export function MediaRenderer({
  url,
  alt,
  type,
  className,
  posterUrl,
  autoPlay = true,
  imgWidth = 1200,
  imgHeight,
  loading = "lazy",
  fetchPriority = "auto",
  videoPreload = "none",
  sizes,
  playInView = false,
}: MediaRendererProps) {
  const isVideo = type === "video" || (type !== "image" && isVideoUrl(url));
  const videoRef = useRef<HTMLVideoElement>(null);

  const poster = posterUrl
    ? imgProxyUrl(posterUrl, Math.min(imgWidth, 1280), imgHeight ?? undefined)
    : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo) return;
    // Économie de données : on garde le poster, pas de téléchargement vidéo.
    if (shouldDeferVideo()) {
      v.preload = "none";
      return;
    }
    if (!playInView) {
      void v.play().catch(() => {});
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Ne demande le fichier qu'une fois proche de l'écran.
            if (v.preload === "none") v.preload = "metadata";
            void v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo, playInView]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className={className}
        autoPlay={autoPlay && !playInView}
        muted
        loop
        playsInline
        preload={playInView ? "none" : videoPreload}
        controlsList="nodownload"
        disablePictureInPicture
        // Le poster disparaît dès le premier frame décodé (pas de trou visuel).
        onPlaying={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        style={{ backgroundColor: "var(--color-bg-secondary, #111)" }}
      />
    );
  }

  // srcset responsif (même ratio, plusieurs largeurs) — uniquement si `sizes` est fourni.
  const srcSet =
    sizes && imgHeight != null
      ? [480, 768, 1200, 1600]
          .map((w) => `${imgProxyUrl(url, w, Math.round((imgHeight / imgWidth) * w))} ${w}w`)
          .join(", ")
      : undefined;

  return (
    <img
      src={imgProxyUrl(url, imgWidth, imgHeight)}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  );
}
