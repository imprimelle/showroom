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
      />
    );
  }

  return <img src={imgProxyUrl(url, imgWidth, imgHeight)} alt={alt} className={className} />;
}
