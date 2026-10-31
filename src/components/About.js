"use client";

import RevealWrapper from "./RevealWrapper";
import SplitTextReveal from "./SplitTextReveal";
import useCountUp from "@/hooks/useCountUp";
import styles from "./About.module.css";

export default function About() {
  // Angka disesuaikan: 300 Ton, 6 Pekerja, 98% Kepuasan
  const produksi = useCountUp(300, 2000);
  const karyawan = useCountUp(6, 1800);
  const kepuasan = useCountUp(98, 1500);

  return (
    <section className={`${styles.about} wrap`} id="tentang">
      <div className={styles.aboutGrid}>
        <RevealWrapper>
          <span className="eyebrow">Tentang Kami</span>
          <h2 className={styles.aboutTitle}>
            <SplitTextReveal text="Komitmen Menghasilkan " delay={200} />
            <br />
            <SplitTextReveal text="Arang Batok Kelapa Premium" delay={400} />
          </h2>
          <p className={styles.aboutText}>
            Didirikan pada 30 Oktober 2026. Kami 
            berdedikasi sebagai penyedia Coconut Shell Charcoal
            berkualitas Premium.
          </p>
          <p className={styles.aboutText}>
            Melalui pengawasan mutu yang ketat, kami selalu memastikan konsistensi 
            kalori dan kualitas produk guna memenuhi kebutuhan pasar B2B, baik 
            untuk skala domestik maupun ekspor.
          </p>
          <a href="#produk" className={styles.aboutBtn}>
            Lihat Produk Kami
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </RevealWrapper>

        <RevealWrapper delay={1}>
          <div className={styles.aboutVisual}>
            <img
              src="/Factory.jpg"
              alt="Fasilitas produksi PT Tunas Kembar Abadi"
              className={styles.aboutImage}
            />
            <div className={styles.statsOverlay}>
              <div className={styles.statItem}>
                <div className={styles.statValue} ref={produksi.ref}>
                  {produksi.count}
                </div>
                <div className={styles.statDesc}>Ton / Tahun</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} ref={karyawan.ref}>
                  {karyawan.count}
                </div>
                <div className={styles.statDesc}>Pekerja</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} ref={kepuasan.ref}>
                  {kepuasan.count}%
                </div>
                <div className={styles.statDesc}>Kepuasan Pelanggan</div>
              </div>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  );
}
