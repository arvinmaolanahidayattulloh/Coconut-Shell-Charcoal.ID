"use client";

import RevealWrapper from "./RevealWrapper";
import styles from "./Partners.module.css";

const PARTNERS = [
  {
    name: "Pertamina",
    logo: (
      <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4h10v8H6V4z" fill="#0066B2" />
        <path d="M16 12h10v8H16v-8z" fill="#39B54A" />
        <path d="M6 20h20v8H6v-8z" fill="#ED1C24" />
        <text x="32" y="22" fontFamily="var(--font-display)" fontSize="15" fontWeight="700" fill="var(--color-carbon)" letterSpacing="-0.02em">PERTAMINA</text>
      </svg>
    ),
  },
  {
    name: "Adaro Energy",
    logo: (
      <svg width="130" height="32" viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 20c0 4.418-3.582 8-8 8s8-3.582 8-8zm0 0c0-4.418 3.582-8 8-8s-8 3.582-8 8z" fill="#39B54A" />
        <circle cx="8" cy="16" r="5" fill="#005A36" />
        <text x="24" y="21" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.04em">ADARO ENERGY</text>
      </svg>
    ),
  },
  {
    name: "Bukit Asam",
    logo: (
      <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 24L12 8l8 16H4z" fill="var(--color-ember)" />
        <path d="M14 24l5-10 5 10H14z" fill="var(--color-ember-light)" />
        <text x="28" y="21" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.02em">BUKIT ASAM</text>
      </svg>
    ),
  },
  {
    name: "Kideco",
    logo: (
      <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4l8 8-8 8-8-8 8-8z" fill="#008080" />
        <path d="M12 9l3.5 3.5-3.5 3.5-3.5-3.5L12 9z" fill="#E6EEF4" />
        <text x="28" y="21" fontFamily="var(--font-display)" fontSize="14" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.06em">KIDECO</text>
      </svg>
    ),
  },
  {
    name: "Bumi Resources",
    logo: (
      <svg width="150" height="32" viewBox="0 0 150 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="16" r="10" stroke="#b87333" strokeWidth="2" />
        <path d="M4 16h16M12 6v20" stroke="#b87333" strokeWidth="1.5" />
        <text x="28" y="21" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.02em">BUMI RESOURCES</text>
      </svg>
    ),
  },
  {
    name: "Indo Tambangraya",
    logo: (
      <svg width="160" height="32" viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6l8 4.5v9l-8 4.5-8-4.5v-9L12 6z" fill="#c45e20" />
        <circle cx="12" cy="15" r="4" fill="#faf8f5" />
        <text x="28" y="21" fontFamily="var(--font-display)" fontSize="12" fontWeight="700" fill="var(--color-carbon)" letterSpacing="0.01em">INDO TAMBANGRAYA</text>
      </svg>
    ),
  },
];

export default function Partners() {
  return (
    <section className={styles.partners}>
      <RevealWrapper>
        <p className={styles.partnersLabel}>
          Dipercaya oleh <strong>perusahaan industri terkemuka</strong> di Indonesia
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
