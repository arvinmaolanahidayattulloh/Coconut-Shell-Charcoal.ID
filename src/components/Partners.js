"use client";

import RevealWrapper from "./RevealWrapper";
import styles from "./Partners.module.css";

const PARTNERS = [
  {
    name: "Valeed.ID",
    logo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #0066B2 0%, #39B54A 50%, #ED1C24 100%)', borderRadius: '4px' }}></div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
          Valeed<span style={{ color: '#0066B2' }}>.id</span>
        </span>
      </div>
    ),
  },
  {
    name: "PT. Bank Central Asia Tbk",
    logo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: '#0060AF', color: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em' }}>
          BCA
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '600', color: '#4b5563', letterSpacing: '0.01em' }}>
          Bank Central Asia
        </span>
      </div>
    ),
  },
  {
    name: "PT. Industri Agribisnis Indonesia",
    logo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px', background: '#c45e20', transform: 'rotate(45deg)', borderRadius: '2px' }}></div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', color: '#111827', letterSpacing: '-0.01em' }}>
          PT. Industri Agribisnis Indonesia
        </span>
      </div>
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
