"use client";

import { useEffect, useRef, useState } from "react";

const esAR = new Intl.NumberFormat("es-AR");

export default function CountUp({
  to,
  duration = 1400,
  prefix = "",
  decimals = 0,
  className,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  const finalText = `${prefix}${esAR.format(Number(to.toFixed(decimals)))}`;

  const renderValue = (value: number) =>
    `${prefix}${esAR.format(Number(value.toFixed(decimals)))}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const animate = (delayTo = duration) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / delayTo);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(to * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setDisplay(to));
      return () => cancelAnimationFrame(raf);
    }

    if (typeof IntersectionObserver === "undefined") {
      animate();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          animate();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {renderValue(display)}
      </span>
      <span className="sr-only">{finalText}</span>
    </span>
  );
}
