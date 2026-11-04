"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import RevealWrapper from "./RevealWrapper";
import { usePrice } from "@/context/PriceContext";
import styles from "./Products.module.css";

const PRODUCTS = [
  {
    name: "Natural",
    subName: "Coconut Shell Charcoal",
    badge: "Best Seller",
    markup: 0, // harga dasar = indeks CSC realtime (PriceContext)
    image: "/products/Natural.jpg",
    specs: [
      { label: "Kadar Air", value: "4,37%", progress: 20.37 },
      { label: "Kadar Abu", value: "1,52%", progress: 10.52 },
      { label: "Zat Terbang", value: "11,37%", progress: 71.37 },
      { label: "Karbon Tetap", value: "81,39%", progress: 81.39 },
      { label: "Nilai Kalori", value: "?%", progress: 0 }
    ]
  },
  {
    name: "Karbon Aktif",
    subName: "Coconut Shell Charcoal",
    badge: "Product",
    markup: 0.25,
    image: "/products/Carbon-Active.png",
    specs: [
      { label: "Kadar Air", value: "4,5%", progress: 20 },
      { label: "Kadar Abu", value: "2,5%", progress: 15 },
      { label: "Volatile Matter", value: "15%", progress: 30 },
      { label: "Iodine Number", value: "750 mg/g", progress: 85 },
      { label: "Serap Benzena", value: "25%", progress: 40 }
    ]
  },
  {
    name: "Briket",
    subName: "Charcoal Briquettes",
    badge: "Costume",
    markup: 0.5,
    image: "/products/Briquettes.jpg",
    specs: [
      { label: "Nilai Kalori", value: "7.200+ kcal/kg", progress: 92 },
      { label: "Durasi Bakar", value: "3 - 5 Jam", progress: 90 },
      { label: "Kadar Abu", value: "< 2.5%", progress: 20 }
    ]
  }
];

// Format sama dengan chart: id-ID, "Rp" tanpa spasi, tanpa desimal.
const fmtNum = (v, dec) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
const sign = (v) => (v >= 0 ? "+" : "-");

// Harga realtime + perubahan harian dari indeks CSC.
// - harga   : PriceContext (diisi PriceChart, maks. 1x per detik)
// - acuan   : candle harian CSC terbaru dari /api/csc (harga buka hari ini, UTC);
//             bila gagal, memakai harga pertama yang diterima sejak halaman dibuka.
// - flash   : warna harga berubah sebentar (hijau naik / merah turun), lalu kembali normal.
function useLiveCsc() {
  const { index } = usePrice();
  const [openUsd, setOpenUsd] = useState(null);
  const [flash, setFlash] = useState(null); // "up" | "down" | null
  const firstRef = useRef(null);
  const prevRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const r = await fetch("/api/csc?iv=1d&limit=1");
        if (!r.ok) return;
        const j = await r.json();
        const o = j?.candles?.[0]?.o;
        if (!dead && o > 0) setOpenUsd(o);
      } catch (e) {
        // abaikan: pakai acuan sesi
      }
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { dead = true; clearInterval(id); };
  }, []);

  const ready = !!index && index.usd > 0 && index.idr > 0;
  const idr = ready ? index.idr : null;
  const usd = ready ? index.usd : null;

  if (ready && firstRef.current === null) firstRef.current = usd;

  useEffect(() => {
    if (idr === null) return;
    const now = Math.round(idr);
    const prev = prevRef.current;
    prevRef.current = now;
    if (prev === null || now === prev) return;
    setFlash(now > prev ? "up" : "down");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlash(null), 700);
  }, [idr]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!ready) return { ready: false };

  const base = openUsd || firstRef.current; // acuan dalam USD
  const chgIdr = base > 0 ? idr - idr * (base / usd) : 0; // perubahan dalam Rupiah
  return { ready: true, idr, chgIdr, flash };
}

function LivePrice({ product, live }) {
  const k = 1 + (product.markup || 0); // Karbon Aktif +25%, Briket +50% dari harga dasar
  const chg = live.ready ? live.chgIdr * k : 0;
  const up = chg >= 0;

  return (
    <div className={styles.livePrice}>
      <div className={styles.livePriceInfo}>
        <div className={styles.livePriceHead}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span className={styles.liveLabel}>Harga Realtime</span>
        </div>
        {live.ready ? (
          <>
            <div
              className={`${styles.livePriceMain} ${
                live.flash === "up" ? styles.up : live.flash === "down" ? styles.down : ""
              }`}
            >
              Rp{fmtNum(live.idr * k, 0)}
            </div>
            <div className={`${styles.livePriceChange} ${up ? styles.up : styles.down}`}>
              {up ? "▲" : "▼"} {sign(chg)}{fmtNum(Math.abs(chg), 0)}
            </div>
          </>
        ) : (
          <div className={styles.livePriceLoading}>Memuat harga realtime…</div>
        )}
      </div>

      <a href="#kontak" className={styles.detailsCta}>
        Buy
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="8" x2="13" y2="8"></line>
          <polyline points="9 4 13 8 9 12"></polyline>
        </svg>
      </a>
    </div>
  );
}

export default function Products() {
  const live = useLiveCsc();
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [isHovered, setIsHovered] = useState(false);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startXRef.current;
    if (Math.abs(diff) > 5) {
      hasDraggedRef.current = true;
    }
    setDragOffset(diff);
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore errors
    }
    
    const swipeThreshold = 60;
    if (dragOffset < -swipeThreshold) {
      handleNext();
    } else if (dragOffset > swipeThreshold) {
      handlePrev();
    }
    setDragOffset(0);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleSelectProduct = (e) => {
      const targetIndex = e.detail;
      if (targetIndex >= 0 && targetIndex < PRODUCTS.length) {
        setActiveIndex(targetIndex);
      }
    };
    window.addEventListener("select-product", handleSelectProduct);
    return () => window.removeEventListener("select-product", handleSelectProduct);
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % PRODUCTS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + PRODUCTS.length) % PRODUCTS.length);
  };

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(handleNext, 3000);
    return () => clearInterval(timer);
  }, [isHovered, activeIndex]);

  useEffect(() => {
    const event = new CustomEvent("product-changed", { detail: activeIndex });
    window.dispatchEvent(event);
  }, [activeIndex]);

  const handleCardClick = (index) => {
    if (hasDraggedRef.current) return;
    setActiveIndex(index);
  };

  const activeProduct = PRODUCTS[activeIndex];

  // Responsive variables
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 1024;
  const cardWidth = isMobile ? 190 : isTablet ? 240 : 290;
  const cardHeight = isMobile ? 260 : isTablet ? 320 : 380;

  return (
    <section 
      className={`${styles.products} wrap`} 
      id="produk"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <RevealWrapper className={styles.sectionHead}>
        <span className="eyebrow">Produk Kami</span>
        <h2 className={styles.sectionTitle}>
          Katalog Produk
        </h2>
        <p className={styles.sectionDesc}>
          Harga diperbarui realtime mengikuti indeks pasar. Geser atau klik kartu untuk informasi selengkapnya.
        </p>
      </RevealWrapper>

      <div className={styles.carouselContainer}>
        {/* Navigation Buttons */}
        <button 
          className={`${styles.navBtn} ${styles.prevBtn}`} 
          onClick={handlePrev} 
          aria-label="Sebelumnya"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className={styles.carouselViewport}>
          <div 
            className={styles.carouselTrack}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: "none" }}
          >
            {PRODUCTS.map((product, i) => {
              // Circular offset calculation
              let diff = i - activeIndex;
              const half = Math.floor(PRODUCTS.length / 2);
              while (diff > half) diff -= PRODUCTS.length;
              while (diff < -half) diff += PRODUCTS.length;

              const absDiff = Math.abs(diff);
              // Only render visible cards for performance and visual clarity
              const isVisible = absDiff <= (isMobile ? 1 : 2);

              if (!isVisible) return null;

              // Overlap cards by ~50% for a tight, premium Coverflow look (48% of cardWidth spacing)
              const spacingFactor = 0.48;
              const xOffset = diff * (cardWidth * spacingFactor);
              const scale = 1 - absDiff * 0.12 + (diff === 0 ? 0.15 : 0);
              const zIndex = 10 - absDiff;
              const opacity = diff === 0 ? 1 : 0.65 - absDiff * 0.22;
              
              // Mobile optimization: disable heavy 3D rotation and filter blur transitions
              const rotateY = isMobile ? 0 : diff * -25;
              const filter = isMobile ? "none" : (diff === 0 ? "blur(0px)" : "blur(1.5px)");
              const cardTransition = isMobile 
                ? { duration: 0.28, ease: "easeOut" } 
                : { type: "spring", stiffness: 140, damping: 18 };

              return (
                <motion.div
                  key={product.name}
                  className={`${styles.productCard} ${diff === 0 ? styles.activeCard : ""}`}
                  style={{ 
                    zIndex,
                    width: cardWidth,
                    height: cardHeight,
                    left: `calc(50% - ${cardWidth / 2}px)`
                  }}
                  animate={{
                    x: xOffset,
                    scale,
                    opacity,
                    rotateY,
                    filter,
                  }}
                  transition={cardTransition}
                  onClick={() => handleCardClick(i)}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div className={styles.productImageWrap}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 180px, 280px"
                      priority={diff === 0}
                      className={styles.productImage}
                      draggable={false}
                    />
                    <div className={styles.imageGlow} />
                  </div>
                  <div className={styles.productCardBody}>
                    <span className={styles.cardBadge}>{product.badge}</span>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    <p className={styles.cardSubname}>{product.subName}</p>
                  </div>
                  {diff === 0 && <div className={styles.activeBorderGlow} />}
                </motion.div>
              );
            })}
          </div>
        </div>

        <button 
          className={`${styles.navBtn} ${styles.nextBtn}`} 
          onClick={handleNext} 
          aria-label="Selanjutnya"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Indicator dots */}
      <div className={styles.dotsContainer}>
        {PRODUCTS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ""}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Buka slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Details Container with text & progress bar animations */}
      <div className={styles.detailsOuter}>
        <motion.div 
          layout 
          className={styles.detailsCard}
          transition={{ layout: { type: "spring", stiffness: 180, damping: 25 } }}
        >
          <div className={styles.detailsGrid}>
            {/* Left Column: Description */}
            <div className={styles.detailsLeft}>
              <div style={{ position: "relative" }}>
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={activeIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className={styles.detailsBadge}
                    style={{ display: "inline-block" }}
                  >
                    {activeProduct.badge}
                  </motion.span>
                </AnimatePresence>
              </div>
              
              <div style={{ position: "relative" }}>
                <AnimatePresence mode="popLayout">
                  <motion.h3 
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className={styles.detailsTitle}
                  >
                    {activeProduct.name.split(" ").map((word, wIdx) => (
                      <span key={wIdx} className={styles.wordWrapper}>
                        <motion.span
                          initial={{ y: 24, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            delay: 0.1 + wIdx * 0.05,
                            duration: 0.4,
                            ease: "easeOut"
                          }}
                          className={styles.wordItem}
                        >
                          {word}&nbsp;
                        </motion.span>
                      </span>
                    ))}
                    <span className={styles.detailsSubTitle}>
                      ({activeProduct.subName})
                    </span>
                  </motion.h3>
                </AnimatePresence>
              </div>

              <div style={{ position: "relative" }}>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.05, duration: 0.25 }}
                  >
                    <LivePrice product={activeProduct} live={live} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Specs with filling progress bars */}
            <div className={styles.detailsRight}>
              <h4 className={styles.specsHeader}>Spesifikasi Teknis</h4>
              <div className={styles.specsList}>
                {activeProduct.specs.map((spec, sIdx) => (
                  <div key={spec.label} className={styles.specItem}>
                    <div className={styles.specTextRow}>
                      <span className={styles.specLabel}>{spec.label}</span>
                      <div style={{ position: "relative" }}>
                        <AnimatePresence mode="popLayout">
                          <motion.span 
                            key={activeIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className={styles.specValue}
                            style={{ display: "inline-block" }}
                          >
                            {spec.value}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className={styles.progressTrack}>
                      <motion.div 
                        key={activeIndex}
                        initial={{ width: 0 }}
                        animate={{ width: `${spec.progress}%` }}
                        transition={{ 
                          delay: 0.1 + sIdx * 0.08, 
                          duration: 0.7, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className={styles.progressBar}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
