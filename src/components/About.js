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
            <SplitTextReveal text="Lebih dari Satu Dekade " delay={200} />
            <br />
            <SplitTextReveal text="Menghasilkan Energi Berkualitas" delay={400} />
          </h2>
          <p className={styles.aboutText}>
            NeoKarbon Indonesia didirikan pada tahun 2014 dengan misi
            menyediakan briket batu bara dan arang berkualitas tinggi untuk
            pasar domestik dan internasional. Dengan fasilitas produksi modern
            di Kalimantan Selatan, kami mampu memenuhi kebutuhan energi
            berbagai sektor industri.
          </p>
          <p className={styles.aboutText}>
            Komitmen kami terhadap mutu dibuktikan dengan sertifikasi ISO 9001
            dan standar ekspor internasional. Setiap produk melalui proses
            quality control ketat untuk memastikan konsistensi kalori, kadar
            air, dan kadar abu sesuai spesifikasi.
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
              alt="Fasilitas produksi NeoKarbon Indonesia"
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
