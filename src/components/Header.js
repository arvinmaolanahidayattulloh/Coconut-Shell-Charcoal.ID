"use client";

import { useState, useEffect } from "react";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang", href: "#tentang" },
  { label: "Produk", href: "#produk" },
  { label: "Keunggulan", href: "#keunggulan" },
  { label: "Kontak", href: "#kontak" },
];

const COMPANY_ITEMS = [
  { label: "Karier", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Sertifikasi", href: "#" },
  { label: "Media", href: "#" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setCompanyOpen(false);
  };

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
    >
      <div className={styles.headerRow}>
        <a href="#beranda" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L11.5 7L17 8L13 12L14 17L9 14.5L4 17L5 12L1 8L6.5 7L9 2Z" fill="currentColor"/>
            </svg>
          </span>
          Coconut Shell Charcoal Indonesia
        </a>

        <nav className={styles.navPill}>
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <a href="#kontak" className={styles.ctaBtn}>
            Hubungi Kami
          </a>
          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
          >
            <div className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}

          <div className={styles.mobileDivider}></div>

          <button
            className={styles.companyToggle}
            onClick={(e) => {
              e.stopPropagation();
              setCompanyOpen(!companyOpen);
            }}
            type="button"
          >
            <span>Perusahaan</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: companyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div className={`${styles.companyMenu} ${companyOpen ? styles.companyMenuOpen : ""}`}>
            {COMPANY_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={styles.mobileLink}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
          </div>

          <a href="https://wa.me/6285168152525" target="_blank" rel="noopener noreferrer" className={styles.mobileCta} onClick={closeMenu}>
            Hubungi Kami
          </a>
        </div>
      </div>
    </header>
  );
}
