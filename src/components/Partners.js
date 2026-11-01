"use client";

import RevealWrapper from "./RevealWrapper";
import styles from "./Partners.module.css";

const PARTNERS = [
  {
    name: "Valeed. ID",
    logo: (
      <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4h10v8H6V4z" fill="#0066B2" />
        <path d="M16 12h10v8H16v-8z" fill="#39B54A" />
        <path d="M6 20h20v8H6v-8z" fill="#ED1C24" />
        <text x="32" y="22" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--color-carbon)" letterSpacing="-0.02em">VALEED.ID</text>
      </svg>
    ),
  },
  {
    name: "PT. Bank Central Asia Tbk.",
    logo: (
      <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#0060AF" />
        <path d="M10 10h12v12H10z" fill="#FFFFFF" />
        <text x="13" y="21" fontFamily="var(--font-display)" fontSize="14" fontWeight="800" fill="#0060AF">BCA</text>
        <text x="40" y="21" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.04em">BCA</text>
      </svg>
    ),
  },
  {
    name: "PT. INAGRIN Tbk.",
    logo: (
      <svg width="130" height="32" viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 24L12 8l8 16H4z" fill="var(--color-ember)" />
        <path d="M14 24l5-10 5 10H14z" fill="var(--color-ember-light)" />
        <text x="28" y="21" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.02em">PT. INAGRIN</text>
      </svg>
    ),
  },
];

export default function Partners() {
  return (
    <section className={styles.partners}>
      <RevealWrapper>
        <p className={styles.partnersLabel}>
          Didukung oleh <strong>mitra dan institusi</strong> terpercaya
        </p>
        
        <div className={styles.marqueeTrack}>
          <div className={styles.marqueeGroup}>
            {PARTNERS.map((partner, idx) => (
              <div key={`${partner.name}-${idx}`} className={styles.partnerLogo}>
                {partner.logo}
              </div>
            ))}
          </div>
          
          <div className={styles.marqueeGroup} aria-hidden="true">
            {PARTNERS.map((partner, idx) => (
              <div key={`${partner.name}-dup-${idx}`} className={styles.partnerLogo}>
                {partner.logo}
              </div>
            ))}
          </div>
        </div>
      </RevealWrapper>
    </section>
  );
}
