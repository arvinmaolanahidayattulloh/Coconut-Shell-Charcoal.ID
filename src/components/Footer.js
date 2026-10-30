import SocialCard from "./SocialCard";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang", href: "#tentang" },
  { label: "Produk", href: "#produk" },
  { label: "Keunggulan", href: "#keunggulan" },
];

const COMPANY_LINKS = [
  { label: "Karier", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Sertifikasi", href: "#" },
  { label: "Media", href: "#" },
];

const CONTACT_INFO = [
  { label: "info@neokarbon.co.id", href: "mailto:info@neokarbon.co.id" },
  { label: "+62 21 5050 8800", href: "tel:+622150508800" },
  { label: "Jl. Industri No. 42, Banjarmasin", href: "#" },
];

export default function Footer() {
  return (
    <footer className={`${styles.footer} wrap`} id="kontak">
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <a href="#beranda" className={styles.logo}>
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
            NeoKarbon
          </a>
          <p className={styles.footerDesc}>
            Produsen dan distributor briket batu bara serta arang berkualitas
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
                <a href={link.href} className={styles.footerLink}>
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
                <a href={link.href} className={styles.footerLink}>
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
        <span>© 2026 NeoKarbon Indonesia. Seluruh hak dilindungi.</span>
        <span>Briket Batu Bara Premium Indonesia</span>
      </div>
    </footer>
  );
}
