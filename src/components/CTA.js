"use client";

import { useState } from "react";
import RevealWrapper from "./RevealWrapper";
import Particles from "./Particles";
import SplitTextReveal from "./SplitTextReveal";
import MagneticButton from "./MagneticButton";
import styles from "./CTA.module.css";

export default function CTA() {
  const [openPartner, setOpenPartner] = useState(null);

  const togglePartner = (id) => {
    setOpenPartner(openPartner === id ? null : id);
  };

  // Data Mitra (1 Asli, 4 Lorem Ipsum)
  const partnersData = [
    {
      id: "tka",
      name: "PT. Tunas Kembar Abadi",
      logo: "/mitra/TunasKembarAbadi/TunasKembarAbadi.png",
      date: "19 Agustus 2026",
      badges: ["Verified", "Supplier"],
      anRekening: "Tunas Kembar Abadi PT",
      noRekening: "BCA : 8692824902",
      kapasitas: "300T / Tahun",
      phone: "+62 851 681 52525",
      email: "TunasKembarAbadi@Gmail.Com",
      image: "/mitra/TunasKembarAbadi/Stock.jpg"
    },
    {
      id: "mitra2",
      name: "PT. Lorem Ipsum Alpha",
      logo: "/logo-mitra.png",
      date: "01 Januari 2024",
      badges: ["Supplier"],
      anRekening: "Lorem Ipsum Corp",
      noRekening: "Mandiri : 1234567890",
      kapasitas: "150T / Tahun",
      phone: "+62 800 111 2222",
      email: "alpha@loremipsum.com",
      image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "mitra3",
      name: "PT. Lorem Ipsum Beta",
      logo: "/logo-mitra.png",
      date: "15 Maret 2023",
      badges: ["Supplier"],
      anRekening: "Beta Ipsum Sejahtera",
      noRekening: "BNI : 0987654321",
      kapasitas: "200T / Tahun",
      phone: "+62 800 333 4444",
      email: "beta@loremipsum.com",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "mitra4",
      name: "PT. Lorem Ipsum Gamma",
      logo: "/logo-mitra.png",
      date: "10 November 2025",
      badges: ["Verified"],
      anRekening: "Gamma Global",
      noRekening: "BRI : 1122334455",
      kapasitas: "100T / Tahun",
      phone: "+62 800 555 6666",
      email: "gamma@loremipsum.com",
      image: "https://images.unsplash.com/photo-1665686376173-ada7a0031a85?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "mitra5",
      name: "PT. Lorem Ipsum Delta",
      logo: "/logo-mitra.png",
      date: "22 Februari 2022",
      badges: ["Supplier"],
      anRekening: "Delta Industri",
      noRekening: "BCA : 5544332211",
      kapasitas: "250T / Tahun",
      phone: "+62 800 777 8888",
      email: "delta@loremipsum.com",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80"
    }
  ];

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

      {/* ================= BAGIAN 2: DAFTAR MITRA (SUSUNAN VERTIKAL KE BAWAH) ================= */}
      <RevealWrapper className={styles.partnersContainer} delay={0.2}>
        <h3 className={styles.partnersTitle}>Jaringan Kami</h3>
        
        <div className={styles.partnersListVertical}>
          {partnersData.map((mitra) => (
            <div 
              key={mitra.id}
              className={`${styles.partnerCard} ${openPartner === mitra.id ? styles.activeCard : ''}`} 
              onClick={() => togglePartner(mitra.id)}
            >
              {/* Bagian Header Kartu: Logo Kiri, Teks Kanan */}
              <div className={styles.partnerHeader}>
                <div className={styles.partnerIdentity}>
                  
                  {/* Logo Kiri */}
                  <div className={styles.partnerLogoWrapper}>
                    <img 
                      src={mitra.logo} 
                      alt={`Logo ${mitra.name}`} 
                      className={styles.partnerLogo}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Logo" }} 
                    />
                  </div>
                  
                  {/* Teks Kanan Logo */}
                  <div className={styles.partnerTitleArea}>
                    <h4 className={styles.partnerName}>{mitra.name}</h4>
                    <span className={styles.partnerDate}>Sejak {mitra.date}</span>
                    <div className={styles.partnerBadges}>
                      {mitra.badges.includes("Verified") && (
                        <span className={styles.badgeVerified}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {mitra.badges.includes("Supplier") && (
                        <span className={styles.badgeSupplier}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                          Supplier
                        </span>
                      )}
                    </div>
                  </div>
                  
                </div>
                
                {/* Ikon Panah Toggle */}
                <div className={styles.toggleIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openPartner === mitra.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Detail Informasi & Gambar (Tampil Jika Diklik) */}
              {openPartner === mitra.id && (
                <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.partnerDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>A.N Rekening</span>
                      <span className={styles.detailValue}>{mitra.anRekening}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>No. Rekening</span>
                      <span className={styles.detailValue}>{mitra.noRekening}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Kapasitas Prod.</span>
                      <span className={styles.detailValue}>{mitra.kapasitas}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Nomor</span>
                      <span className={styles.detailValue}>{mitra.phone}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Email</span>
                      <span className={styles.detailValue}>{mitra.email}</span>
                    </div>
                  </div>

                  <div className={styles.expandedImageWrapper}>
                    <img 
                      src={mitra.image} 
                      alt={`Foto Fasilitas ${mitra.name}`} 
                      className={styles.expandedImage} 
                    />
                  </div>
                </div>
              )}
              
            </div>
          ))}
        </div>
      </RevealWrapper>
      
    </section>
  );
}
