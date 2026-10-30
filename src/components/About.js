"use client";

import RevealWrapper from "./RevealWrapper";
import SplitTextReveal from "./SplitTextReveal";
import useCountUp from "@/hooks/useCountUp";
import styles from "./About.module.css";

export default function About() {
  const produksi = useCountUp(50000, 2000);
  const karyawan = useCountUp(200, 1800);
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
            Di Dirikan pada 19 Agustus 2026. Kami 
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
              src="/about-factory.png"
              alt="Fasilitas produksi PT Tunas Kembar Abadi"
              className={styles.aboutImage}
            />
            <div className={styles.statsOverlay}>
              <div className={styles.statItem}>
                <div className={styles.statValue} ref={produksi.ref}>
                  {produksi.count.toLocaleString("id-ID")}
                </div>
                <div className={styles.statDesc}>Ton/Tahun Produksi</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue} ref={karyawan.ref}>
                  {karyawan.count}+
                </div>
                <div className={styles.statDesc}>Tenaga Profesional</div>
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
