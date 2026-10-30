"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import RevealWrapper from "./RevealWrapper";
import styles from "./Products.module.css";

const PRODUCTS = [
  {
    name: "Batu Bara",
    subName: "Coal",
    badge: "Energi Fosil Alam",
    desc: "Bahan bakar fosil alami berkalori tinggi yang melimpah, digunakan sebagai sumber energi utama pembangkit listrik dan pembakaran industri skala besar.",
    image: "/products/coal.png",
    specs: [
      { label: "Nilai Kalori", value: "6.500+ kcal/kg", progress: 85 },
      { label: "Kadar Abu", value: "10 - 15%", progress: 70 },
      { label: "Kadar Air", value: "8 - 12%", progress: 60 }
    ]
  },
  {
    name: "Arang Batok Kelapa",
    subName: "Coconut Shell Charcoal",
    badge: "Premium Shisha & BBQ",
    desc: "Dibuat dari tempurung kelapa tua pilihan. Memiliki panas tinggi, merata, tanpa asap, abu abu putih tipis, serta sangat diminati pasar internasional.",
    image: "/products/coconut_shell_charcoal.png",
    specs: [
      { label: "Nilai Kalori", value: "7.300+ kcal/kg", progress: 95 },
      { label: "Durasi Bakar", value: "3 - 4 Jam", progress: 80 },
      { label: "Kadar Abu", value: "< 3%", progress: 25 }
    ]
  },
  {
    name: "Arang Kayu",
    subName: "Wood Charcoal / Lump Charcoal",
    badge: "BBQ Tradisional",
    desc: "Arang bongkahan kayu keras alami. Mudah menyala, memberikan aroma khas smokey alami pada masakan panggangan, cocok untuk kuliner sate, steak, dan BBQ.",
    image: "/products/wood_charcoal.png",
    specs: [
      { label: "Durasi Bakar", value: "2 - 3 Jam", progress: 60 },
      { label: "Kadar Abu", value: "3 - 4%", progress: 35 },
      { label: "Kadar Air", value: "< 6%", progress: 40 }
    ]
  },
  {
    name: "Arang Bambu",
    subName: "Bamboo Charcoal",
    badge: "Purifikasi & Deodoran",
    desc: "Memiliki porositas tinggi dan struktur internal yang padat. Sangat baik untuk filter air, penyerap kelembaban ruangan, menetralisir bau, dan produk kecantikan.",
    image: "/products/bamboo_charcoal.png",
    specs: [
      { label: "Daya Serap", value: "Sangat Tinggi", progress: 95 },
      { label: "Kemurnian", value: "98%", progress: 98 },
      { label: "Kadar Air", value: "< 8%", progress: 50 }
    ]
  },
  {
    name: "Arang Kemiri",
    subName: "Candlenut Shell Charcoal",
    badge: "Bahan Bakar Alternatif",
    desc: "Terbuat dari cangkang kemiri yang keras dan kering. Menghasilkan panas stabil dan biasanya digunakan untuk pembakaran besi, pandai besi, maupun briket campuran.",
    image: "/products/candlenut_charcoal.png",
    specs: [
      { label: "Nilai Kalori", value: "6.000+ kcal/kg", progress: 75 },
      { label: "Kadar Abu", value: "< 5%", progress: 45 },
      { label: "Kadar Air", value: "< 8%", progress: 50 }
    ]
  },
  {
    name: "Arang Briket",
    subName: "Charcoal Briquettes",
    badge: "Shisha Premium",
    desc: "Arang halus dari tempurung kelapa atau kayu yang dipadatkan dengan bahan perekat alami (tapioka). Bentuk kubus atau heksagonal yang presisi, panasnya sangat stabil dan minim abu.",
    image: "/products/charcoal_briquettes.png",
    specs: [
      { label: "Nilai Kalori", value: "7.200+ kcal/kg", progress: 92 },
      { label: "Durasi Bakar", value: "3 - 5 Jam", progress: 90 },
      { label: "Kadar Abu", value: "< 2.5%", progress: 20 }
    ]
  },
  {
    name: "Arang Serbuk Gergaji",
    subName: "Sawdust Charcoal / Sawdust Briquette",
    badge: "Ekspor BBQ Premium",
    desc: "Terbuat dari serbuk gergaji kayu keras yang dikompres padat tanpa bahan kimia perekat, lalu dikarbonisasi. Sangat padat, awet, menghasilkan panas stabil tanpa percikan api.",
    image: "/products/sawdust_charcoal.png",
    specs: [
      { label: "Nilai Kalori", value: "7.000+ kcal/kg", progress: 90 },
      { label: "Durasi Bakar", value: "4 - 5 Jam", progress: 95 },
      { label: "Kadar Abu", value: "< 3.5%", progress: 30 }
    ]
  },
  {
    name: "Arang Sekam Padi",
    subName: "Rice Husk Charcoal",
    badge: "Pertanian & Media Tanam",
    desc: "Hasil pembakaran sekam padi tidak sempurna. Porositas tinggi, kaya unsur silika, ideal untuk media tanam hortikultura, pupuk tanah, maupun insulator panas industri cor logam.",
    image: "/products/rice_husk_charcoal.png",
    specs: [
      { label: "Kandungan Silika", value: "90%", progress: 90 },
      { label: "Porositas", value: "Tinggi", progress: 85 },
      { label: "pH Tanah", value: "7.0 - 8.5", progress: 75 }
    ]
  },
  {
    name: "Arang Aktif / Karbon Aktif",
    subName: "Activated Charcoal",
    badge: "Filtrasi & Medis",
    desc: "Karbon yang diaktifkan melalui pemanasan suhu tinggi dan uap untuk memperluas luas permukaan pori-porinya. Digunakan untuk penjernih air, masker udara, dan detoksifikasi tubuh.",
    image: "/products/activated_charcoal.png",
    specs: [
      { label: "Iodine Number", value: "800 - 1100 mg/g", progress: 95 },
      { label: "Luas Permukaan", value: "Sangat Tinggi", progress: 90 },
      { label: "Kadar Abu", value: "< 4%", progress: 35 }
    ]
  },
  {
    name: "Arang Binchotan",
    subName: "Binchotan / White Charcoal",
    badge: "Khas Jepang Tradisional",
    desc: "Arang premium khas Jepang yang terbuat dari kayu oak Ubame. Dibakar pada suhu yang sangat tinggi (>1000°C), menghasilkan arang yang keras seperti logam, tanpa asap, tanpa bau, dan sangat tahan lama.",
    image: "/products/binchotan.png",
    specs: [
      { label: "Kadar Karbon", value: "> 95%", progress: 98 },
      { label: "Durasi Bakar", value: "5 - 7 Jam", progress: 100 },
      { label: "Tanpa Asap & Bau", value: "Ya (100%)", progress: 100 }
    ]
  },
  {
    name: "Arang Bonggol Jagung",
    subName: "Corncob Charcoal",
    badge: "Biomassa Alternatif",
    desc: "Pemanfaatan limbah pertanian bonggol jagung menjadi bahan bakar biomassa ekonomis. Sering dibuat briket ramah lingkungan untuk konsumsi lokal dan panggangan.",
    image: "/products/corncob_charcoal.png",
    specs: [
      { label: "Nilai Kalori", value: "5.000+ kcal/kg", progress: 60 },
      { label: "Kadar Abu", value: "< 7%", progress: 55 },
      { label: "Kadar Air", value: "< 8%", progress: 50 }
    ]
  },
  {
    name: "Arang Cangkang Sawit",
    subName: "Palm Kernel Shell Charcoal",
    badge: "Bahan Bakar Industri",
    desc: "Arang yang terbuat dari limbah cangkang kelapa sawit, memiliki nilai kalori tinggi dan sering diekspor untuk bahan bakar industri berat, boiler, dan pengecoran logam.",
    image: "/products/palm_shell_charcoal.png",
    specs: [
      { label: "Nilai Kalori", value: "5.800+ kcal/kg", progress: 72 },
      { label: "Kadar Karbon", value: "> 75%", progress: 75 },
      { label: "Kadar Air", value: "< 8%", progress: 50 }
    ]
  },
  {
    name: "Arang Tulang",
    subName: "Bone Char / Bone Charcoal",
    badge: "Pemurni & Filter Air",
    desc: "Terbuat dari tulang hewan yang dikarbonisasi. Memiliki struktur pori kalsium fosfat alami yang sangat efektif menyerap fluorida, logam berat dalam air, serta dekolorisasi gula tebu.",
    image: "/products/bone_charcoal.png",
    specs: [
      { label: "Kalsium Fosfat", value: "~80%", progress: 80 },
      { label: "Daya Serap Logam", value: "Sangat Baik", progress: 90 },
      { label: "Kadar Air", value: "< 5%", progress: 40 }
    ]
  }
];

export default function Products() {
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
          Katalog Arang &amp; Batubara Lengkap
        </h2>
        <p className={styles.sectionDesc}>
          Jelajahi 13 jenis bahan bakar padat alami dan olahan berkualitas tinggi kami. Geser atau klik kartu untuk informasi selengkapnya.
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
                  <motion.p 
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.05, duration: 0.25 }}
                    className={styles.detailsDesc}
                  >
                    {activeProduct.desc}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className={styles.detailsCtaWrap}>
                <a href="#kontak" className={styles.detailsCta}>
                  Minta Penawaran
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="8" x2="13" y2="8"></line>
                    <polyline points="9 4 13 8 9 12"></polyline>
                  </svg>
                </a>
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
