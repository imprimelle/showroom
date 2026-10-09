"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * Étape 2.1 — Viewer 3D vectoriel (Three.js) : modèle de la Table Cacao LED
 * en fil de fer (wireframe) + panneau LED émissif (shader GLSL), rotation lente.
 * Three.js est importé dynamiquement et la scène n'est montée que lorsque le
 * bloc entre dans le viewport (perf / PageSpeed).
 */
export function WireframeTable() {
  const mountRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    const start = async () => {
      const three = await import("three");
      if (disposed) return;

      const width = mount.clientWidth || 480;
      const height = mount.clientHeight || 480;

      const scene = new three.Scene();
      const camera = new three.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 2.6, 7.5);
      camera.lookAt(0, 0.4, 0);

      const renderer = new three.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      const group = new three.Group();
      const amber = 0xffa500;
      const wireMat = new three.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.85 });

      // Plateau de la table (caisse mince) en fil de fer
      const topGeo = new three.EdgesGeometry(new three.BoxGeometry(3, 0.28, 2));
      const topLines = new three.LineSegments(topGeo, wireMat);
      topLines.position.y = 0.9;
      group.add(topLines);

      // Quatre pieds
      const legGeo = new three.EdgesGeometry(new three.BoxGeometry(0.18, 0.9, 0.18));
      const positions: [number, number][] = [
        [-1.2, -1.2],
        [1.2, -1.2],
        [-1.2, 1.2],
        [1.2, 1.2],
      ];
      positions.forEach(([x, z]) => {
        const leg = new three.LineSegments(legGeo, wireMat);
        leg.position.set(x, 0.45, z);
        group.add(leg);
      });

      // Panneau LED « cacao » émissif (shader GLSL — halo radial type bloom)
      const glowGeo = new three.PlaneGeometry(2.5, 1.5);
      const glowMat = new three.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: three.AdditiveBlending,
        uniforms: {
          uColor: { value: new three.Color(amber) },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform vec3 uColor;
          uniform float uTime;
          void main() {
            vec2 c = vUv - 0.5;
            float d = length(c) * 2.0;
            float pulse = 0.75 + 0.25 * sin(uTime * 2.0);
            float glow = smoothstep(1.0, 0.0, d) * pulse;
            vec3 col = uColor * (0.35 + glow * 1.7);
            gl_FragColor = vec4(col, glow);
          }
        `,
      });
      const glowPanel = new three.Mesh(glowGeo, glowMat);
      glowPanel.position.y = 1.06;
      glowPanel.rotation.x = -Math.PI / 2;
      group.add(glowPanel);

      scene.add(group);

      const clock = new three.Clock();
      let raf = 0;

      const render = () => {
        if (disposed) return;
        const t = clock.getElapsedTime();
        glowMat.uniforms.uTime.value = t;
        group.rotation.y += 0.004;
        group.position.y = Math.sin(t * 0.8) * 0.05;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);

      const onResize = () => {
        const w = mount.clientWidth || width;
        const h = mount.clientHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        group.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();
        void start();
      },
      { rootMargin: "200px" }
    );
    observer.observe(mount);

    return () => {
      disposed = true;
      observer.disconnect();
      cleanup?.();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
