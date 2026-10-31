"use client";

import RevealWrapper from "./RevealWrapper";
import Particles from "./Particles";
import SplitTextReveal from "./SplitTextReveal";
import MagneticButton from "./MagneticButton";
import styles from "./CTA.module.css";

export default function CTA() {
  return (
    <section className={`${styles.ctaSection} wrap`}>
      
      {/* ================= BAGIAN 1: CTA UTAMA ================= */}
      <RevealWrapper className={styles.cta}>
        <div className={styles.ctaBg}></div>
        <div className={styles.ctaOverlay}></div>
        <Particles count={30} speed={0.8} />
        <div className={styles.ctaGlow}></div>
        
        <h2 className={styles.ctaTitle}>
          <SplitTextReveal text="Siap Bermitra dengan Kami?" delay={200} />
        </h2>
        
        <p className={styles.ctaDesc}>
          Dapatkan penawaran terbaik untuk kebutuhan
          arang Anda. Tim kami siap membantu konsultasi dari pemilihan produk
          hingga pengiriman ke lokasi.
        </p>
        
        <div className={styles.ctaActions}>
          <MagneticButton 
            as="a" 
            href="https://wa.me/6285168152525" 
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnLight}
          >
            Hubungi Kami
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </MagneticButton>
          <MagneticButton as="a" href="#produk" className={styles.btnGhost}>
            Download Katalog
          </MagneticButton>
        </div>
      </RevealWrapper>

      {/* ================= BAGIAN 2: DAFTAR MITRA ================= */}
      <RevealWrapper className={styles.partnersContainer} delay={0.2}>
        <h3 className={styles.partnersTitle}>Jaringan Kemitraan Kami</h3>
        <p className={styles.partnersSubtitle}>
          Perusahaan yang telah terdaftar dan terverifikasi sebagai mitra resmi.
        </p>
        
        <div className={styles.partnersList}>
          
          {/* Mitra 1: PT. Tunas Kembar Abadi */}
          <div className={styles.partnerCard}>
            <div className={styles.partnerHeader}>
              <div className={styles.partnerLogoWrapper}>
                <img 
                  src="/logo-tka.png" 
                  alt="Logo PT Tunas Kembar Abadi" 
                  className={styles.partnerLogo}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Gambar+TKA" }} 
                />
              </div>
              <div className={styles.partnerBadges}>
                <span className={styles.badgeVerified}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Verified
                </span>
                <span className={styles.badgeSupplier}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Supplier
                </span>
              </div>
            </div>
            <div className={styles.partnerInfo}>
              <h4 className={styles.partnerName}>PT. Tunas Kembar Abadi Tbk</h4>
              <a href="mailto:tunaskembarabadi@gmail.com" className={styles.partnerEmail}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
                tunaskembarabadi@gmail.com
              </a>
            </div>
          </div>

          {/* Mitra 2: Supplier Lainnya */}
          <div className={styles.partnerCard}>
            <div className={styles.partnerHeader}>
              <div className={styles.partnerLogoWrapper}>
                <img 
                  src="/logo-mitra.png" 
                  alt="Logo Nama Mitra" 
                  className={styles.partnerLogo}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Gambar+Mitra" }} 
                />
              </div>
              <div className={styles.partnerBadges}>
                <span className={styles.badgeSupplier}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Supplier
                </span>
              </div>
            </div>
            <div className={styles.partnerInfo}>
              <h4 className={styles.partnerName}>PT. Nama Mitra Sejahtera</h4>
              <a href="mailto:info@namamitra.com" className={styles.partnerEmail}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
                info@namamitra.com
              </a>
            </div>
          </div>

        </div>
      </RevealWrapper>
      
    </section>
  );
}
