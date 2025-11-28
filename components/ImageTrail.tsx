"use client";

import { useEffect, useRef } from "react";

type TrailItemState = {
  el: HTMLImageElement;
  rect: DOMRect | null;
  // animation state
  anim?: {
    startTime: number;
    duration: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    fromScale: number;
    toScale: number;
    fromOpacity: number;
    toOpacity: number;
  } | null;
};

interface Props {
  images: string[];
  count?: number;      // number of DOM images to create (rotating buffer)
  threshold?: number;  // distance threshold to show next image
  size?: number;       // base size (we set width style)
}

export default function ImageTrail({
  images,
  count = 6,
  threshold = 100,
  size = 250,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // positions in viewport coords
  const mousePos = useRef({ x: 0, y: 0 });
  const cacheMousePos = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });

  // items
  const items = useRef<TrailItemState[]>([]);
  const imgIndex = useRef(0);   // next image to use
  const zIndexVal = useRef(1);

  // helpers: easing approximations
  const easeExpoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easePower1Out = (t: number) => 1 - (1 - t) * (1 - t); // approx quad out
  const easeQuintOut = (t: number) => 1 - Math.pow(1 - t, 5);

  // linear interpolation
  const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
  const dist = (x1: number, y1: number, x2: number, y2: number) =>
    Math.hypot(x2 - x1, y2 - y1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // preload images (simple)
    const preloadAll = async () => {
      const promises = images.map(
        (src) =>
          new Promise<void>((resolve) => {
            const i = new Image();
            i.src = src;
            i.onload = () => resolve();
            i.onerror = () => resolve();
          })
      );
      await Promise.all(promises);
    };

    let raf = 0;
    let running = true;

    preloadAll().then(() => {
      // create DOM img elements (buffer)
      items.current = [];
      for (let i = 0; i < count; i++) {
        const el = document.createElement("img");
        el.className = "trail-item";
        el.draggable = false;
        el.style.position = "fixed"; // viewport coordinates
        el.style.width = `${size}px`;
        el.style.height = "auto";
        el.style.pointerEvents = "none";
        el.style.opacity = "0";
        el.style.transform = `translate3d(-9999px,-9999px,0) scale(1)`;
        el.style.zIndex = String(1000 - i);
        el.setAttribute("data-idx", String(i));
        container.appendChild(el);

        items.current.push({ el, rect: null, anim: null });
      }

      // listener: global pointermove (you can attach to container too)
      const onPointerMove = (ev: PointerEvent) => {
        mousePos.current.x = ev.clientX;
        mousePos.current.y = ev.clientY;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      // initialize cache & last positions
      cacheMousePos.current = { ...mousePos.current };
      lastMousePos.current = { ...mousePos.current };

      // render loop
      const render = (t: number) => {
        // update cacheMousePos with lerp for smoothing (like demo)
        cacheMousePos.current.x = lerp(
          cacheMousePos.current.x || mousePos.current.x,
          mousePos.current.x,
          0.1
        );
        cacheMousePos.current.y = lerp(
          cacheMousePos.current.y || mousePos.current.y,
          mousePos.current.y,
          0.1
        );

        // distance between current mouse and last shown image position
        const distance = dist(
          mousePos.current.x,
          mousePos.current.y,
          lastMousePos.current.x,
          lastMousePos.current.y
        );

        // show next image if passed threshold
        if (distance > threshold) {
          showNext();
          lastMousePos.current = { ...mousePos.current };
        }

        // animate each active item
        const now = performance.now();
        let anyActive = false;
        for (const item of items.current) {
          if (!item.anim) continue;
          anyActive = true;
          const a = item.anim;
          const elapsed = Math.min(1, (now - a.startTime) / a.duration);
          // easing for motion and fade/scale can be different; use Expo for motion, Power1 for opacity, Quint for scale
          const tMotion = easeExpoOut(elapsed);
          const tOpacity = easePower1Out(elapsed);
          const tScale = easeQuintOut(elapsed);

          const curX = lerp(a.fromX, a.toX, tMotion);
          const curY = lerp(a.fromY, a.toY, tMotion);
          const curScale = lerp(a.fromScale, a.toScale, tScale);
          const curOpacity = lerp(a.fromOpacity, a.toOpacity, tOpacity);

          item.el.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${curScale})`;
          item.el.style.opacity = String(curOpacity);

          if (elapsed >= 1) {
            // animation done: hide and clear
            item.el.style.opacity = "0";
            item.anim = null;
          }
        }

        // if nothing is active you could reset zIndexVal if you want
        if (!anyActive) {
          zIndexVal.current = 1;
        }

        if (running) raf = requestAnimationFrame(render);
      };

      raf = requestAnimationFrame(render);

      function showNext() {
        // pick next buffer item
        const i = imgIndex.current % items.current.length;
        const item = items.current[i];
        const imgSrc = images[imgIndex.current % images.length];

        // set image src (if changed)
        if (item.el.src !== location.origin + imgSrc) {
          // set absolute path for HTMLImageElement.src resolution (works with public/)
          item.el.src = imgSrc;
        }

        // ensure rect info (for centering using width/height)
        // getBoundingClientRect might be zero if image not rendered yet; fallback to width/height
        const w = item.el.width || size;
        const h = item.el.height || size;

        // start & end positions in viewport coordinates (top-left for translate)
        const startX = cacheMousePos.current.x - w / 2;
        const startY = cacheMousePos.current.y - h / 2;
        const endX = mousePos.current.x - w / 2;
        const endY = mousePos.current.y - h / 2;

        // prepare animation parameters similar to Codrops:
        // show immediately (opacity 1, scale 1), move (0.9s expo), then fade out (1s), scale down to 0.2 (1s)
        // We combine into a single timeline by animating from full to end values.
        const totalDuration = 1000; // milliseconds for the main timeline (we'll mimic offsets via from/to)
        const moveDuration = 900;
        const fadeDelay = 400; // start fading at 0.4s
        const fadeDuration = 1000;
        const scaleDelay = 400;
        const scaleDuration = 1000;

        // start time
        const now = performance.now();

        // set initial quick style (startAt in GSAP)
        item.el.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;
        item.el.style.opacity = "1";
        item.el.style.zIndex = String(zIndexVal.current++);
        // set animation object: animate from start to end (we'll set to final target as endpoint)
        item.anim = {
          startTime: now,
          duration: Math.max(moveDuration, fadeDelay + fadeDuration, scaleDelay + scaleDuration),
          fromX: startX,
          fromY: startY,
          toX: endX,
          toY: endY,
          fromScale: 1,
          toScale: 0.2,
          fromOpacity: 1,
          toOpacity: 0,
        };

        // increment indices
        imgIndex.current = (imgIndex.current + 1) % images.length;
      }

      // cleanup on unmount
      const cleanup = () => {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointerMove as EventListener);
        items.current.forEach((it) => it.el.remove());
        items.current = [];
      };

      // attach cleanup to closure so we can call from return
      (render as any).cleanup = cleanup;
    }); // end preloadAll().then

    return () => {
      // call cleanup if set (render closure assigned)
      ( (requestAnimationFrame as unknown) as any ); // noop to satisfy TS linter
      // remove all elements and listeners by calling cleanup if exists
      const cleanupFn = ( ( (window as any).__imageTrailCleanup__ ) as (() => void) ) ;
      // we may not have stored cleanup globally; just do safe DOM cleanup:
      items.current.forEach((it) => it.el.remove());
      items.current = [];
    };
  }, [images, count, threshold, size]);

  return <div ref={containerRef} className="trail-area" />;
}
