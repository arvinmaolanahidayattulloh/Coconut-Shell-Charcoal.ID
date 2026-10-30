"use client";

import { useEffect, useRef } from "react";
import styles from "./SplitTextReveal.module.css";

export default function SplitTextReveal({ text, type = "word", delay = 0, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      el.classList.add(styles.visible);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add(styles.visible);
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  let elements = [];
  if (type === "word") {
    elements = text.split(" ").map((word, i) => (
      <span key={i} className={styles.wrapper}>
        <span className={styles.item} style={{ transitionDelay: `${i * 0.05}s` }}>
          {word}&nbsp;
        </span>
      </span>
    ));
  } else if (type === "char") {
    elements = text.split("").map((char, i) => (
      <span key={i} className={styles.wrapper}>
        <span className={styles.item} style={{ transitionDelay: `${i * 0.02}s` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      </span>
    ));
  }

  return (
    <span ref={containerRef} className={`${styles.container} ${className}`}>
      {elements}
    </span>
  );
}
