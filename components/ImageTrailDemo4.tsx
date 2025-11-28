"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  images: string[];      // list of image paths (e.g. ['/imgs/1.jpg', ...])
  threshold?: number;    // mouse distance to spawn next image (default: 80)
  minWidth?: number;     // min random width in px (default: 150)
  maxWidth?: number;     // max random width in px (default: 350)
  fallDistance?: number; // optional extra fall distance multiplier (not required)
};

export default function ImageTrailDemo4({
  images,
  threshold = 80,
  minWidth = 150,
  maxWidth = 350,
  fallDistance = 1,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // helpers
    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
    const distance = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x2 - x1, y2 - y1);
    const getRandomFloat = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    // window size
    let winsize = { width: window.innerWidth, height: window.innerHeight };
    const updateWinSize = () => {
      winsize = { width: window.innerWidth, height: window.innerHeight };
    };
    window.addEventListener("resize", updateWinSize);

    // mouse positions
    let mousePos = { x: 0, y: 0 };
    let lastMousePos = { x: 0, y: 0 };
    let cacheMousePos = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      // use clientX/Y so positions are viewport-based
      mousePos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Trail image class
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
        // append to body so it is not constrained by any container
        document.body.appendChild(this.el);
        this.rect = this.el.getBoundingClientRect();
      }

      updateRect() {
        this.rect = this.el.getBoundingClientRect();
      }

      isActive() {
        return gsap.isTweening(this.el) || this.el.style.opacity !== "0";
      }

      // sets a random width and recomputes rect
      setRatio() {
        const rand = getRandomFloat(minWidth, maxWidth);
        this.el.style.width = `${Math.round(rand)}px`;
        this.el.style.height = "auto";
        this.updateRect();
      }
    }

    // create trail image objects (we create one per provided image)
    const imgObjects = images.map((src) => new TrailImage(src));
    const total = imgObjects.length;
    let idx = 0;
    let zIndex = 1;

    // main loop
    let running = true;
    const render = () => {
      // smoothing toward mouse
      cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
      cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

      const d = distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

      if (d > threshold) {
        spawn();
        idx = idx < total - 1 ? idx + 1 : 0;
        lastMousePos = { ...mousePos };
        zIndex++;
      }

      // reset zIndex when idle
      const idle = !imgObjects.some((img) => img.isActive());
      if (idle) zIndex = 1;

      if (running) requestAnimationFrame(render);
    };

    // spawn function (replicates demo4 behavior)
    const spawn = () => {
      const img = imgObjects[idx];
      img.setRatio();
      img.updateRect();

      // start (smoothed) coordinates
      const startX = cacheMousePos.x - img.rect.width / 2;
      const startY = cacheMousePos.y - img.rect.height / 2;

      // end coordinates (current mouse)
      const endX = mousePos.x - img.rect.width / 2;
      const endY = mousePos.y - img.rect.height / 2;

      gsap.killTweensOf(img.el);

      // compute random final translations (range is based on viewport + image size)
      const randX = getRandomFloat(
        -1 * (winsize.width + img.rect.width / 2),
        winsize.width + img.rect.width / 2
      );
      const randY = getRandomFloat(
        -1 * (winsize.height + img.rect.height / 2),
        winsize.height + img.rect.height / 2
      );
      const randRot = getRandomFloat(-40, 40);

      // timeline similar to original: show -> move -> fade -> translate + rotate far
      const tl = gsap.timeline();
      tl.set(
        img.el,
        {
          opacity: 1,
          rotation: 0,
          zIndex,
          x: startX,
          y: startY,
        },
        0
      );

      // animate position to current mouse (slight follow)
      tl.to(
        img.el,
        {
          duration: 1.6,
          ease: "expo.out",
          x: endX,
          y: endY,
        },
        0
      );

      // fade out
      tl.to(
        img.el,
        {
          duration: 0.8,
          ease: "power1.out",
          opacity: 0,
        },
        0.6
      );

      // final dramatic translate & rotate (relative values)
      // use relative += strings supported by GSAP
      tl.to(
        img.el,
        {
          duration: 1,
          ease: "quint.out",
          x: `+=${randX * fallDistance}`,
          y: `+=${randY * fallDistance}`,
          rotation: randRot,
        },
        0.6
      );
    };

    // start loop
    render();

    // cleanup
    return () => {
      running = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", updateWinSize);
      imgObjects.forEach((i) => i.el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.join("|"), threshold, minWidth, maxWidth, fallDistance]);

  return <div ref={contentRef} className="content" />;
}
