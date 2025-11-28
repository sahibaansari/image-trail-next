"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  images: string[];     // images to trail
  threshold?: number;   // when to spawn next image
};

export default function ImageTrailDemo2({ images, threshold = 100 }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // --------------------------------
    // Helper functions
    // --------------------------------
    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const distance = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x2 - x1, y2 - y1);

    let mousePos = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    let cacheMousePos = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mousePos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // --------------------------------
    // Single trail image object
    // --------------------------------
    class TrailImage {
      el: HTMLImageElement;
      rect: DOMRect;

      constructor(src: string) {
        this.el = document.createElement("img");
        this.el.src = src;
        this.el.className = "trail-img";
        this.el.style.position = "fixed";
        this.el.style.opacity = "0";
        this.el.style.pointerEvents = "none";
        this.el.style.left = "0";
        this.el.style.top = "0";

        document.body.appendChild(this.el);
        this.rect = this.el.getBoundingClientRect();
      }

      updateRect() {
        this.rect = this.el.getBoundingClientRect();
      }

      isActive() {
        return gsap.isTweening(this.el) || this.el.style.opacity !== "0";
      }
    }

    // --------------------------------
    // Setup
    // --------------------------------
    const imgObjects = images.map((src) => new TrailImage(src));
    const total = imgObjects.length;
    let current = 0;
    let zIndex = 1;

    // --------------------------------
    // Render Loop
    // --------------------------------
    const render = () => {
      cacheMousePos.x = lerp(cacheMousePos.x, mousePos.x, 0.1);
      cacheMousePos.y = lerp(cacheMousePos.y, mousePos.y, 0.1);

      const dist = distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

      if (dist > threshold) {
        spawn();
        current = current < total - 1 ? current + 1 : 0;
        lastMousePos = { ...mousePos };
        zIndex++;
      }

      // Reset zIndex if all inactive
      if (!imgObjects.some((i) => i.isActive())) {
        zIndex = 1;
      }

      requestAnimationFrame(render);
    };

    // --------------------------------
    // Spawn next image
    // --------------------------------
    const spawn = () => {
      const img = imgObjects[current];
      img.updateRect();

      const startX = cacheMousePos.x - img.rect.width / 2;
      const startY = cacheMousePos.y - img.rect.height / 2;
      const endX = mousePos.x - img.rect.width / 2;
      const endY = mousePos.y - img.rect.height / 2;

      gsap.killTweensOf(img.el);

      gsap
        .timeline()
        .set(
          img.el,
          {
            opacity: 1,
            scale: 1,
            x: startX,
            y: startY,
            zIndex,
          },
          0
        )
        .to(
          img.el,
          {
            duration: 1.8,
            ease: "expo.out",
            x: endX,
            y: endY,
          },
          0
        )
        .to(
          img.el,
          {
            duration: 0.8,
            ease: "power1.out",
            opacity: 0,
          },
          0.8
        )
        .to(
          img.el,
          {
            duration: 0.8,
            ease: "quint.inOut",
            scale: 2,
          },
          0.8
        );
    };

    render();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      imgObjects.forEach((i) => i.el.remove());
    };
  }, [images, threshold]);

  return <div ref={contentRef} className="content"></div>;
}
    