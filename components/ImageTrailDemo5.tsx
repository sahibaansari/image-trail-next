"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
  images: string[];      // e.g. ["/imgs/1.jpg", "/imgs/2.jpg"]
  threshold?: number;    // default 100
  minFallRatio?: number; // min fall as fraction of window height (default 0.5)
  maxFallRatio?: number; // max fall as fraction of window height (default 1)
  imgWidth?: number;     // optional fixed width in px (overrides CSS width)
};

export default function ImageTrailDemo5({
  images,
  threshold = 100,
  minFallRatio = 0.5,
  maxFallRatio = 1,
  imgWidth,
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
      // use client coords (viewport-based)
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
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        // optional fixed width override
        if (imgWidth) {
          this.el.style.width = `${imgWidth}px`;
          this.el.style.height = "auto";
        }
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

    // create trail image objects
    const imgObjects = images.map((src) => new TrailImage(src));
    const total = imgObjects.length;
    let idx = 0;
    let zIndex = 1;
    let running = true;

    // main loop
    const render = () => {
      cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
      cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

      const d = distance(mousePos.x, mousePos.y, lastMousePos.x, lastMousePos.y);

      if (d > threshold) {
        spawn();
        idx = idx < total - 1 ? idx + 1 : 0;
        lastMousePos = { ...mousePos };
        zIndex++;
      }

      const idle = !imgObjects.some((i) => i.isActive());
      if (idle) zIndex = 1;

      if (running) requestAnimationFrame(render);
    };

    // spawn function — implements demo5 behavior
    const spawn = () => {
      const img = imgObjects[idx];
      img.updateRect();

      // position centered at cursor
      const startX = mousePos.x - img.rect.width / 2;
      const startY = mousePos.y - img.rect.height / 2;

      gsap.killTweensOf(img.el);

      // compute a random fall distance between min/max ratios of viewport height
      const fallDistance =
        getRandomFloat(minFallRatio * winsize.height, maxFallRatio * winsize.height);

      // timeline:
      // 1) set at cursor with transformOrigin '50% -10%'
      // 2) short squash/stretch then fade out then scale adjustments and drop
      const tl = gsap.timeline();

      tl.set(
        img.el,
        {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          x: startX,
          y: startY,
          zIndex,
          transformOrigin: "50% -10%",
        },
        0
      );

      // fade out quickly (starts at 0.4)
      tl.to(
        img.el,
        {
          duration: 0.5,
          ease: "power1.out",
          opacity: 0,
        },
        0.4
      );

      // quick squash/stretch
      tl.to(
        img.el,
        {
          duration: 0.2,
          ease: "quad.in",
          scaleX: 0.5,
          scaleY: 2,
        },
        0.4
      );

      // then expand slightly and drop by fallDistance
      tl.to(
        img.el,
        {
          duration: 0.5,
          ease: "expo.out",
          scaleX: 0.7,
          scaleY: 1.7,
          y: `+=${Math.round(fallDistance)}`,
        },
        0.6
      );
    };

    render();

    // cleanup
    return () => {
      running = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", updateWinSize);
      imgObjects.forEach((i) => i.el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.join("|"), threshold, minFallRatio, maxFallRatio, imgWidth]);

  return <div ref={contentRef} className="content" />;
}
