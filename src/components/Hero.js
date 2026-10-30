"use client";

import RevealWrapper from "./RevealWrapper";
import useCountUp from "@/hooks/useCountUp";
import SplitTextReveal from "./SplitTextReveal";
import MagneticButton from "./MagneticButton";
import Particles from "./Particles";
import styles from "./Hero.module.css";

export default function Hero() {
  const yearsCount = useCountUp(10, 1800);
  const clientsCount = useCountUp(500, 2000);
  const countriesCount = useCountUp(15, 1500);

  return (
    <section className={`${styles.hero} wrap`} id="beranda">
      <div className={styles.heroGrid}>
        <RevealWrapper>
          <span className="eyebrow">Produsen Briket Terpercaya</span>
          <h1 className={styles.heroTitle}>
            <SplitTextReveal text="Briket Batu Bara " delay={100} />
            <br />
            <span className={styles.titleAccent}>
              <SplitTextReveal text="Premium " delay={400} />
            </span>
            <SplitTextReveal text="untuk" delay={400} />
            <br />
            <SplitTextReveal text="Industri Indonesia" delay={700} />
          </h1>
          <p className={styles.heroDesc}>
            NeoKarbon Indonesia memproduksi briket batu bara dan arang
            berkualitas tinggi dengan standar internasional. Solusi energi
            terpercaya untuk kebutuhan industri, restoran, dan ekspor.
          </p>
          <div className={styles.heroActions}>
            <MagneticButton as="a" href="#produk" className={styles.btnPrimary}>
              Lihat Produk
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </MagneticButton>
            <MagneticButton as="a" href="#kontak" className={styles.btnSecondary}>
              Hubungi Kami
            </MagneticButton>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber} ref={yearsCount.ref}>
                {yearsCount.count}+
              </span>
              <span className={styles.statLabel}>Tahun Pengalaman</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber} ref={clientsCount.ref}>
                {clientsCount.count}+
              </span>
              <span className={styles.statLabel}>Klien Industri</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber} ref={countriesCount.ref}>
                {countriesCount.count}
              </span>
              <span className={styles.statLabel}>Negara Ekspor</span>
            </div>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={1}>
          <div className={styles.heroVisual}>
            <Particles count={40} className={styles.heroParticles} />
            <img
              src="/hero-briquette.png"
              alt="Briket batu bara premium NeoKarbon Indonesia"
              className={styles.heroImage}
            />
            <div className={styles.heroOverlayCard}>
              <div className={styles.overlayInfo}>
                <div className={styles.overlayIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <div className={styles.overlayTitle}>
                    Sertifikasi ISO 9001
                  </div>
                  <div className={styles.overlaySub}>
                    Standar mutu internasional
                  </div>
                </div>
              </div>
              <div className={styles.overlayBadge}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2.5 6.5L5 9L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Tersertifikasi
              </div>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
