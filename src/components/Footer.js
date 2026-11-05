"use client";

import { usePathname } from "next/navigation";
import SocialCard from "./SocialCard";
import styles from "./Footer.module.css";
import { HALAMAN_PERUSAHAAN } from "@/data/Halaman";

const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang", href: "#tentang" },
  { label: "Produk", href: "#produk" },
  { label: "Keunggulan", href: "#keunggulan" },
];

// Karier, Blog, Certificate, Galery → dibuka di TAB BARU
const COMPANY_LINKS = HALAMAN_PERUSAHAAN;

const CONTACT_INFO = [
  { label: "Info@CoconutShellCharcoal.ID", href: "mailto:Info@CoconutShellCharcoal.ID" },
  { label: "+62 851 681 52525", href: "tel:+6285168152525" },
  { label: "Jl. Sarikaya No.217 RT.6/RW.14 Depok Jaya Kecamatan Pancoran Mas Depok Jawa Barat 16432", href: "#" },
];

export default function Footer() {
  // di halaman selain beranda, tautan "#bagian" menuju beranda: "/#bagian"
  const pathname = usePathname();
  const ke = (href) => (pathname === "/" ? href : `/${href}`);
  return (
    <footer className={`${styles.footer} wrap`} id="kontak">
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <a href={ke("#beranda")} className={styles.logo}>
            <span className={styles.logoIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M9 2L11.5 7L17 8L13 12L14 17L9 14.5L4 17L5 12L1 8L6.5 7L9 2Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Coconut Shell Charcoal Indonesia
          </a>
          <p className={styles.footerDesc}>
            Produsen dan distributor arang tempurung kelapa berkualitas
            tinggi untuk kebutuhan industri, restoran, dan ekspor
            internasional.
          </p>
          <div style={{ marginTop: "24px" }}>
            <SocialCard />
          </div>
        </div>

        <div className={styles.footerCol}>
          <h5>Navigasi</h5>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={ke(link.href)} className={styles.footerLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footerCol}>
          <h5>Perusahaan</h5>
          <ul>
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footerCol}>
          <h5>Kontak</h5>
          <ul>
            {CONTACT_INFO.map((info) => (
              <li key={info.label}>
                <a href={info.href} className={styles.footerLink}>
                  {info.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© 2026 Coconut Shell Charcoal Indonesia. Seluruh Hak Dilindungi.</span>
        <span>Premium Indonesia</span>
      </div>
    </footer>
  );
}
