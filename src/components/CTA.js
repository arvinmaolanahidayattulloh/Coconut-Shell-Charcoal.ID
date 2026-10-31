"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import RevealWrapper from "./RevealWrapper";
import Particles from "./Particles";
import SplitTextReveal from "./SplitTextReveal";
import MagneticButton from "./MagneticButton";
import styles from "./CTA.module.css";

function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.lightboxBackdrop} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose} type="button" aria-label="Tutup">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img src={src} alt={alt} className={styles.lightboxImage} />
        <p className={styles.lightboxCaption}>{alt}</p>
      </div>
    </div>,
    document.body
  );
}

export default function CTA() {
  const [openPartner, setOpenPartner] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const cardRefs = useRef({});

  const togglePartner = useCallback((id) => {
    const isClosing = openPartner === id;
    setOpenPartner(isClosing ? null : id);

    if (!isClosing && cardRefs.current[id]) {
      setTimeout(() => {
        cardRefs.current[id].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [openPartner]);

  const openLightbox = useCallback((e, src, alt) => {
    e.stopPropagation();
    setLightbox({ src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  const partnersData = [
    {
      id: "tka",
      name: "PT. TUNAS KEMBAR ABADI",
      logo: "/mitra/TunasKembarAbadi/TunasKembarAbadi.png",
      date: "19 Agustus 2026",
      badges: ["Verified", "Supplier"],
      skKemenkumham: "AHU-A114664.AH.01.30.TAHUN 2026",
      tglPendirian: "19 AGUSTUS 2026",
      nib: "1908260098691",
      npwp: "1000000010800297",
      hsCode: "4402.20.10",
      alamatKantor: "Kemiri Muka, Beji, Kota Depok, Jawa Barat 16423",
      alamatOperasional: "Tajur, Kec. Citeureup, Kabupaten Bogor, Jawa Barat 16810",
      bank: "BCA Bank Central Asia",
      anRekening: "PT. Tunas Kembar Abadi",
      noRekening: "8692824902",
      swiftCode: "CENAIDJA",
      direktur: "ARVIN MAOLANA HIDAYATTULLOH",
      jabatan: "Direktur",
      nik: "3304031108040002",
      phone: "0851-6815-2525",
      email: "tunaskembarabadi@gmail.com",
      mapsLink: "https://maps.app.goo.gl/JYLr9eo5BByxD5aV6?g_st=ac",
      driveLink: "https://drive.google.com",
      embedMap: "https://maps.google.com/maps?q=-6.536306,106.892095&t=&z=15&ie=UTF8&iwloc=&output=embed",
      images: [
        { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Stok Arang Batok Kelapa" },
        { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Gudang Penyimpanan" },
        { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Proses Produksi" },
      ]
    }
  ];

  return (
    <section className={`${styles.ctaSection} wrap`}>
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

      <RevealWrapper className={styles.partnersContainer} delay={0.2}>
        <h3 className={styles.partnersTitle}>Jaringan Kami</h3>

        <div className={styles.partnersListVertical}>
          {partnersData.map((mitra) => (
            <div
              key={mitra.id}
              ref={(el) => (cardRefs.current[mitra.id] = el)}
              className={`${styles.partnerCard} ${openPartner === mitra.id ? styles.activeCard : ""}`}
              onClick={() => togglePartner(mitra.id)}
            >
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
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: openPartner === mitra.id ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              {openPartner === mitra.id && (
                <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoSection}>
                      <h5 className={styles.sectionHeading}>Legalitas & Registrasi</h5>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NIB</span>
                        <span className={styles.detailValueHighlight}>{mitra.nib}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>NPWP</span>
                        <span className={styles.detailValueHighlight}>{mitra.npwp}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>SK Kemenkumham</span>
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

                  <div className={styles.locationSection}>
                    <h5 className={styles.sectionHeading}>Lokasi Terdaftar & Operasional</h5>

                    <div className={styles.addressGrid}>
                      <div className={styles.addressBox}>
                        <span className={styles.detailLabel}>Alamat Terdaftar</span>
                        <p className={styles.detailText}>{mitra.alamatKantor}</p>
                      </div>
                      <div className={styles.addressBox}>
                        <span className={styles.detailLabel}>Alamat Operasional</span>
                        <p className={styles.detailText}>{mitra.alamatOperasional}</p>
                      </div>
                    </div>

                    <div className={styles.mapContainer}>
                      <iframe
                        src={mitra.embedMap}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Peta Operasional PT. Tunas Kembar Abadi"
                      ></iframe>
                    </div>

                    <div className={styles.locationButtons}>
                      <a href={mitra.mapsLink} target="_blank" rel="noopener noreferrer" className={styles.btnMaps}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C7.59 2 4 5.59 4 10c0 5.57 7.15 11.43 7.46 11.69a.75.75 0 0 0 1.08 0C12.85 21.43 20 15.57 20 10c0-4.41-3.59-8-8-8z" fill="#EA4335"/>
                          <circle cx="12" cy="10" r="3" fill="#ffffff"/>
                          <path d="M12 2C7.59 2 4 5.59 4 10c0 1.85.63 3.55 1.69 4.9L12 7l6.31 7.9A7.96 7.96 0 0 0 20 10c0-4.41-3.59-8-8-8z" fill="#4285F4" opacity="0.3"/>
                        </svg>
                        Google Maps
                      </a>
                      <a href={mitra.driveLink} target="_blank" rel="noopener noreferrer" className={styles.btnDrive}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M8.01 2.34L1.34 14h6.67l6.67-11.66H8.01z" fill="#0066DA"/>
                          <path d="M14.68 2.34L8.01 14l3.33 5.66L22.67 8h-6.66l-1.33-5.66z" fill="#00AC47" opacity="0.9"/>
                          <path d="M1.34 14l3.33 5.66h14.67L22.67 14H1.34z" fill="#EA4335" opacity="0.9"/>
                          <path d="M8.01 14h6.67l3.33 5.66H4.67L8.01 14z" fill="#FFBA00"/>
                        </svg>
                        Google Drive
                      </a>
                    </div>
                  </div>

                  <div className={styles.gallerySection}>
                    <h5 className={styles.sectionHeading}>Dokumentasi Fasilitas</h5>
                    <div className={styles.galleryGrid}>
                      {mitra.images.map((img, idx) => (
                        <div
                          key={idx}
                          className={styles.galleryItem}
                          onClick={(e) => openLightbox(e, img.src, img.alt)}
                        >
                          <img src={img.src} alt={img.alt} className={styles.galleryImage} />
                          <div className={styles.galleryOverlay}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                          </div>
                          <span className={styles.galleryCaption}>{img.alt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      </RevealWrapper>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}
    </section>
  );
}
