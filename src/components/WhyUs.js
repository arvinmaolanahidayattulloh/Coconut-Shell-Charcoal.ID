"use client";

import RevealWrapper from "./RevealWrapper";
import styles from "./WhyUs.module.css";

const TILES = [
  {
    value: "25 T",
    label: "Kapasitas / Bulan",
    desc: "Menjamin ketersediaan pasokan Coconut Shell Charcoal skala besar.",
  },
  {
    value: "98%",
    label: "Kepuasan Klien",
    desc: "Retensi tinggi dari mitra industri nasional.",
  },
  {
    value: "0 T",
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
    title: "Konsultasi",
    desc: "Spesifikasi teknis ditentukan bersama, meliputi fixed carbon, kadar air, kadar abu, dan ukuran.",
  },
  {
    num: "02",
    title: "Paid Sample",
    desc: "Sampel diberikan secara berbayar untuk pengujian pada tungku dan laboratorium sebelum PO diterbitkan.",
  },
  {
    num: "03",
    title: "Pembayaran",
    desc: "Harga berbasis EXW sesuai volume pemesanan. Pembayaran sebesar 100% wajib dilakukan pada saat PO diterbitkan.",
  },
  {
    num: "04",
    title: "Produksi",
    desc: "Produksi diselesaikan dalam waktu 30 hari sejak PO diterbitkan. Pengambilan barang dapat dilakukan secara parsial.",
  },
  {
    num: "05",
    title: "Finish",
    desc: "Barang diambil langsung di pabrik (EXW) atau dikirim ke lokasi pembeli sesuai jadwal yang disepakati.",
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
            <p>Ketentuan pemesanan Coconut Shell Charcoal</p>
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
