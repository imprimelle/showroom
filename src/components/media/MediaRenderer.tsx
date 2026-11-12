"use client";
import { imgProxyUrl } from "@/lib/images";
import { isVideoUrl } from "@/lib/utils";

interface MediaRendererProps {
  url: string;
  alt?: string;
  /** Force le type. Sinon auto-détecté depuis l'URL. */
  type?: "image" | "video";
  /** Classes appliquées à l'<img> ou <video>. */
  className?: string;
  /** Poster (image) pour la vidéo. */
  posterUrl?: string;
  autoPlay?: boolean;
  /** Largeur de l'image pour imgProxy (images uniquement). */
  imgWidth?: number;
  /** Hauteur cible (ratio). À fournir pour éviter la déformation (resize=cover). */
  imgHeight?: number;
  /** `loading` natif de l'<img> (default "lazy"). Passer "eager" pour le LCP. */
  loading?: "lazy" | "eager";
  /** `fetchPriority` de l'<img> ("high" pour l'image héro). */
  fetchPriority?: "high" | "low" | "auto";
  /** `preload` natif de la <video> (default "none" — ne télécharge pas avant lecture). */
  videoPreload?: "none" | "metadata" | "auto";
  /** Attribut `sizes` (ex. "100vw") → active le `srcset` responsif sur les images. */
  sizes?: string;
}

/**
 * Rendu un média (image ou vidéo) selon le type détecté.
 * Image → imgProxyUrl (webp redimensionné). Vidéo → <video> autoplay/muted/loop.
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
}: MediaRendererProps) {
  const isVideo = type === "video" || (type !== "image" && isVideoUrl(url));

  if (isVideo) {
    return (
      <video
        src={url}
        poster={posterUrl ? imgProxyUrl(posterUrl, imgWidth, imgHeight) : undefined}
        className={className}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        preload={videoPreload}
        controlsList="nodownload"
        disablePictureInPicture
      />
    );
  }

  // srcset responsif (même ratio, plusieurs largeurs) — uniquement si `sizes` est fourni.
  const srcSet =
    sizes && !isVideo && imgHeight != null
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
      className={className}
    />
  );
}
