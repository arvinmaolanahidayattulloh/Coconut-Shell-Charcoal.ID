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
      
      // 01 IDENTITAS & LEGALITAS PERUSAHAAN
      skKemenkumham: "AHU-A114664.AH.01.30.TAHUN 2026",
      tglPendirian: "19 AGUSTUS 2026",
      nib: "1908260098691",
      npwp: "1000000010800297",
      hsCode: "4402.20.10", // Menggantikan KBLI
      alamatOperasional: "Tajur, Kec. Citeureup, Kabupaten Bogor, Jawa Barat 16810",
      
      // 02 INFORMASI PERBANKAN
      bank: "BCA Bank Central Asia",
      anRekening: "PT. Tunas Kembar Abadi",
      noRekening: "8692824902",
      swiftCode: "CENAIDJA",
      
      // 03 PENANGGUNG JAWAB
      direktur: "ARVIN MAOLANA HIDAYATTULLOH",
      jabatan: "Direktur", // Diubah hanya Direktur
      nik: "3304031108040002",
      
      // 04 INFORMASI KONTAK & PETA
      phone: "0851-6815-2525",
      email: "tunaskembarabadi@gmail.com",
      
      // Tautan Maps asli dan URL Embed
      mapsLink: "https://maps.app.goo.gl/JYLr9eo5BByxD5aV6?g_st=ac",
      // Embed menggunakan titik koordinat/query yang mengarah ke area yang sama
      embedMap: "https://maps.google.com/maps?q=-6.536306,106.892095&t=&z=15&ie=UTF8&iwloc=&output=embed", 
      
      image: "/mitra/TunasKembarAbadi/Stock.jpg"
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

              {/* --- DETAIL KONTEN FULL DATA --- */}
              {openPartner === mitra.id && (
                <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  
                  <div className={styles.infoGrid}>
                    
                    {/* Kolom 1: Legalitas */}
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Identitas & Legalitas</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NIB</span>
                        <span className={styles.detailValueBadge}>{mitra.nib}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NPWP</span>
                        <span className={styles.detailValueBadge}>{mitra.npwp}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>SK KEMENKUMHAM</span>
                        <span className={styles.detailValue}>{mitra.skKemenkumham}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Tgl Pendirian</span>
                        <span className={styles.detailValue}>{mitra.tglPendirian}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>HS Code</span>
                        <span className={styles.detailValueBadge}>{mitra.hsCode}</span>
                      </div>
                    </div>

                    {/* Kolom 2: Penanggung Jawab & Kontak */}
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Penanggung Jawab & Kontak</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Nama</span>
                        <span className={styles.detailValue}>{mitra.direktur}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Jabatan</span>
                        <span className={styles.detailValue}>{mitra.jabatan}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NIK</span>
                        <span className={styles.detailValue}>{mitra.nik}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Telepon</span>
                        <span className={styles.detailValue}>{mitra.phone}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{mitra.email}</span>
                      </div>
                    </div>

                    {/* Kolom 3: Perbankan */}
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Informasi Perbankan</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Bank</span>
                        <span className={styles.detailValue}>{mitra.bank}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>A.N Rekening</span>
                        <span className={styles.detailValue}>{mitra.anRekening}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>No. Rekening</span>
                        <span className={styles.detailValueHighlight}>{mitra.noRekening}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>SWIFT Code</span>
                        <span className={styles.detailValueBadge}>{mitra.swiftCode}</span>
                      </div>
                    </div>

                  </div>

                  {/* Bagian Peta & Alamat Spesifik */}
                  <div className={styles.locationSection}>
                    <h5 className={styles.sectionHeading}>Lokasi Operasional</h5>
                    
                    <div className={styles.addressBox}>
                      <p className={styles.detailText}>{mitra.alamatOperasional}</p>
                    </div>

                    {/* Container Peta Google Maps */}
                    <div className={styles.mapContainer}>
                      <iframe 
                        src={mitra.embedMap} 
                        allowFullScreen="" 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Peta Operasional"
                      ></iframe>
                    </div>
                    
                    <a href={mitra.mapsLink} target="_blank" rel="noopener noreferrer" className={styles.btnMaps}>
                       Buka di Google Maps
                    </a>
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
