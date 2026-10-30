"use client";

import { useEffect, useRef } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    // Simple custom smooth scroll to complement native behavior
    const html = document.documentElement;
    const body = document.body;

    let isScrolling = false;
    let currentY = window.scrollY;
    let targetY = window.scrollY;

    const ease = 0.08;

    const scroll = () => {
      if (!isScrolling) return;

      currentY += (targetY - currentY) * ease;
      window.scrollTo(0, currentY);

      if (Math.abs(targetY - currentY) > 0.5) {
        requestAnimationFrame(scroll);
      } else {
        isScrolling = false;
      }
    };

    const handleWheel = (e) => {
      // Prevent default to override with JS smooth scroll on desktop
      // Only apply custom smooth scrolling if we don't prefer reduced motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      
      // Allow native scroll for touch devices
      if (e.pointerType === 'touch' || e.type === 'touchmove') return;

      e.preventDefault();
      targetY += e.deltaY;
      targetY = Math.max(0, Math.min(targetY, body.scrollHeight - window.innerHeight));

      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(scroll);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
