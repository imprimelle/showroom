"use client";

import { useState } from "react";

/**
 * Étape 2.2 — L'artisanat de la découpe numérique.
 * Affiche une boucle vidéo compressée (WebM/MP4, muted, loop, playsinline) de la
 * fraiseuse CNC. Si aucune vidéo n'est encore fournie (ou en cas d'échec de
 * chargement), bascule sur une illustration SVG animée (SMIL) de la CNC.
 *
 * 👉 Pour activer la vraie vidéo : déposer `video-cnc.mp4` dans `/public/notre-histoire/`
 *    et renseigner `CNC_VIDEO_URL`.
 */
const CNC_VIDEO_URL = ""; // ex : "/notre-histoire/video-cnc.mp4"

export function CncCutting() {
  const [videoFailed, setVideoFailed] = useState(!CNC_VIDEO_URL);

  if (CNC_VIDEO_URL && !videoFailed) {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={CNC_VIDEO_URL}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        onError={() => setVideoFailed(true)}
        aria-label="Fraiseuse CNC en action sur le bois, l'Alucobond et l'acrylique"
      />
    );
  }

  return <CncIllustration />;
}

function CncIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="w-full h-full" role="img">
        <defs>
          <radialGradient id="cnc-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,165,0,0.22)" />
            <stop offset="100%" stopColor="rgba(255,165,0,0)" />
          </radialGradient>
          <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2a1a" />
            <stop offset="100%" stopColor="#2a1e12" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="400" height="400" fill="url(#cnc-glow)" />

        {/* Plateau à usiner */}
        <rect x="60" y="220" width="280" height="90" rx="8" fill="url(#board)" stroke="#1a120a" strokeWidth="2" />

        {/* Trait de coupe animé */}
        <path
          d="M 90 265 L 310 265 L 310 300 L 90 300 Z"
          fill="none"
          stroke="#ffa500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="600"
          strokeDashoffset="600"
          opacity="0.9"
        >
          <animate attributeName="stroke-dashoffset" from="600" to="0" dur="5s" repeatCount="indefinite" />
        </path>

        {/* Portique (gantry) mobile */}
        <g>
          <rect x="60" y="150" width="14" height="160" fill="#2b2b31" />
          <rect x="60" y="150" width="280" height="12" fill="#3a3a42" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 220 0; 0 0"
            dur="5s"
            repeatCount="indefinite"
          />
        </g>

        {/* Fraise (broche) qui descend et tourne */}
        <g>
          <g>
            <circle cx="130" cy="185" r="13" fill="#44444d" stroke="#ffa500" strokeWidth="1.5" />
            <line x1="130" y1="172" x2="130" y2="198" stroke="#ffa500" strokeWidth="1.5" />
            <line x1="117" y1="185" x2="143" y2="185" stroke="#ffa500" strokeWidth="1.5" />
            <animateTransform attributeName="transform" type="rotate" from="0 130 185" to="360 130 185" dur="0.6s" repeatCount="indefinite" />
          </g>
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 18; 0 0; 220 0; 0 0" dur="5s" repeatCount="indefinite" />
        </g>

        {/* Étincelles */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={130 + i * 12} cy={215} r="2" fill="#ffd27a">
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="1.4s"
              begin={`${i * 0.35}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="215;205"
              dur="1.4s"
              begin={`${i * 0.35}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
