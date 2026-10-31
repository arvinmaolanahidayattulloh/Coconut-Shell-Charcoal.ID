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

  const partnersData = [
    {
      id: "tka",
      name: "PT. TUNAS KEMBAR ABADI",
      logo: "/mitra/TunasKembarAbadi/TunasKembarAbadi.png",
      date: "19 Agustus 2026",
      badges: ["Verified", "Supplier"],
      anRekening: "PT. Tunas Kembar Abadi",
      noRekening: "BCA : 8692824902",
      nib: "1908260098691",
      npwp: "1000000010800297",
      direktur: "ARVIN MAOLANA HIDAYATTULLOH",
      alamatKantor: "Kemiri Muka, Beji, Kota Depok, Jawa Barat 16423",
      alamatOperasional: "Tajur, Kec. Citeureup, Kabupaten Bogor, Jawa Barat 16810",
      koordinat: "-6.536306, 106.892095", // Koordinat area Citeureup/Tajur
      embedMap: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.123456789!2d106.892095!3d-6.536306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMzInMTAuNyJTIDEwNsKwNTMnMzEuNSJF!5e0!3m2!1sid!2sid!4v1700000000000",
      phone: "0851-6815-2525 / 0856-1261-039",
      email: "tunaskembarabadi@gmail.com",
      image: "/mitra/TunasKembarAbadi/Stock.jpg"
    }
  ];

  return (
    <section className={`${styles.ctaSection} wrap`}>
      {/* ... [BAGIAN CTA UTAMA TETAP SAMA] ... */}
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
          <MagneticButton as="a" href="https://wa.me/6285168152525" target="_blank" rel="noopener noreferrer" className={styles.btnLight}>
            Hubungi Kami
          </MagneticButton>
          <MagneticButton as="a" href="#produk" className={styles.btnGhost}>
            Download Katalog
          </MagneticButton>
        </div>
      </RevealWrapper>

      {/* ================= BAGIAN 2: DAFTAR MITRA ================= */}
      <RevealWrapper className={styles.partnersContainer} delay={0.2}>
        <h3 className={styles.partnersTitle}>Jaringan Kami</h3>
        
        <div className={styles.partnersListVertical}>
          {partnersData.map((mitra) => (
            <div 
              key={mitra.id}
              className={`${styles.partnerCard} ${openPartner === mitra.id ? styles.activeCard : ''}`} 
              onClick={() => togglePartner(mitra.id)}
            >
              {/* --- HEADER KARTU --- */}
              <div className={styles.partnerHeader}>
                <div className={styles.partnerIdentity}>
                  <div className={styles.partnerLogoWrapper}>
                    <img src={mitra.logo} alt={`Logo ${mitra.name}`} className={styles.partnerLogo} />
                  </div>
                  <div className={styles.partnerTitleArea}>
                    <h4 className={styles.partnerName}>{mitra.name}</h4>
                    <span className={styles.partnerDate}>Sejak {mitra.date}</span>
                    <div className={styles.partnerBadges}>
                      <span className={styles.badgeVerified}>Verified</span>
                      <span className={styles.badgeSupplier}>Supplier</span>
                    </div>
                  </div>
                </div>
                <div className={styles.toggleIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openPartner === mitra.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {/* --- DETAIL KONTEN (MUNCUL JIKA DIKLIK) --- */}
              {openPartner === mitra.id && (
                <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  
                  {/* Grid Informasi Terstruktur */}
                  <div className={styles.infoGrid}>
                    
                    {/* Kolom 1: Legalitas */}
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Identitas & Legalitas</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Dirut</span>
                        <span className={styles.detailValue}>{mitra.direktur}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NIB</span>
                        <span className={styles.detailValueBadge}>{mitra.nib}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NPWP</span>
                        <span className={styles.detailValueBadge}>{mitra.npwp}</span>
                      </div>
                    </div>

                    {/* Kolom 2: Perbankan & Kontak */}
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Perbankan & Kontak</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>A.N Rek</span>
                        <span className={styles.detailValue}>{mitra.anRekening}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>No. Rek</span>
                        <span className={styles.detailValueHighlight}>{mitra.noRekening}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Telp</span>
                        <span className={styles.detailValue}>{mitra.phone}</span>
                      </div>
                    </div>

                  </div>

                  {/* Bagian Peta & Alamat Spesifik */}
                  <div className={styles.locationSection}>
                    <h5 className={styles.sectionHeading}>Lokasi Operasional</h5>
                    
                    <div className={styles.addressBox}>
                      <p className={styles.detailText}>{mitra.alamatOperasional}</p>
                      <span className={styles.coordinateText}>📍 Koordinat: {mitra.koordinat}</span>
                    </div>

                    {/* Container Peta (Tidak akan pecah saat di-geser/zoom) */}
                    <div className={styles.mapContainer}>
                      <iframe 
                        src={mitra.embedMap} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Peta Operasional"
                      ></iframe>
                    </div>
                  </div>

                  {/* Gambar Pabrik / Gudang */}
                  <div className={styles.expandedImageWrapper}>
                    <img src={mitra.image} alt="Fasilitas" className={styles.expandedImage} />
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
