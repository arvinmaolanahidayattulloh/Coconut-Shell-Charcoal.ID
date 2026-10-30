"use client";

import RevealWrapper from "./RevealWrapper";
import styles from "./WhyUs.module.css";

const TILES = [
  {
    value: "50.000 T",
    label: "Kapasitas / Tahun",
    desc: "Menjamin ketersediaan pasokan briket skala besar.",
  },
  {
    value: "98%",
    label: "Kepuasan Klien",
    desc: "Retensi tinggi dari mitra industri nasional.",
  },
  {
    value: "12.400 T",
    label: "Volume Ekspor",
    desc: "Pengiriman global ke Asia Timur & Timur Tengah.",
  },
  {
    value: "ISO 9001",
    label: "Sertifikasi Mutu",
    desc: "Jaminan kontrol kualitas bertaraf internasional.",
  },
];

const STAGES = [
  {
    num: "01",
    title: "Konsultasi & Sampel",
    desc: "Diskusi spesifikasi teknis kalori, kadar air, dan abu, dilanjutkan pengiriman sampel briket untuk pengujian tungku Anda.",
  },
  {
    num: "02",
    title: "Penawaran & Kontrak",
    desc: "Transparansi harga berbasis volume pemesanan serta penandatanganan kesepakatan suplai jangka panjang.",
  },
  {
    num: "03",
    title: "Produksi & Kontrol Mutu",
    desc: "Pengolahan briket di pabrik terintegrasi kami dengan pengujian lab per batch untuk menjaga konsistensi kualitas.",
  },
  {
    num: "04",
    title: "Pengiriman Terjadwal",
    desc: "Distribusi aman menggunakan jaringan logistik darat dan laut langsung ke lokasi pabrik Anda atau pelabuhan tujuan.",
  },
];

export default function WhyUs() {
  return (
    <section className={`${styles.whyUs} wrap`} id="keunggulan">
      <RevealWrapper className={styles.sectionHead}>
        <span className="eyebrow">Keunggulan Kami</span>
        <h2 className={styles.sectionTitle}>
          Proses Terintegrasi dari Hulu ke Hilir
        </h2>
        <p className={styles.sectionDesc}>
          Kami mengkombinasikan kapasitas produksi skala besar dengan sistem
          kontrol mutu dan alur kerja yang profesional untuk menjamin kelancaran energi bisnis Anda.
        </p>
      </RevealWrapper>

      <div className={styles.gridContainer}>
        {/* Left Column: Glassmorphism Tiles */}
        <RevealWrapper className={styles.tilesGrid}>
          {TILES.map((tile) => (
            <div key={tile.label} className={styles.tile}>
              <div className={styles.tileDecor}></div>
              <div className={styles.tileValue}>{tile.value}</div>
              <div className={styles.tileLabel}>{tile.label}</div>
              <p className={styles.tileDesc}>{tile.desc}</p>
            </div>
          ))}
        </RevealWrapper>

        {/* Right Column: Beautiful Interactive Step Timeline */}
        <RevealWrapper className={styles.timelineSection} delay={2}>
          <div className={styles.timelineHeader}>
            <h3>Alur Proses Kerja</h3>
            <p>Tahapan pemesanan briket profesional kami</p>
          </div>
          
          <div className={styles.timeline}>
            <div className={styles.timelineLine}></div>
            {STAGES.map((stage, idx) => (
              <div key={stage.num} className={styles.timelineStep}>
                <div className={styles.stepIndicator}>
                  <span className={styles.stepNum}>{stage.num}</span>
                  <div className={styles.stepPulse}></div>
                </div>
                <div className={styles.stepContent}>
                  <h4 className={styles.stepTitle}>{stage.title}</h4>
                  <p className={styles.stepDesc}>{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
