"use client";
// [FILE: src/components/GradePicker.jsx]
// Pilihan Grade berbentuk select (tombol + daftar turun), gaya sama dengan pilihan Bank. "None" = belum memilih grade
// (harga yang tampil adalah harga dasar indeks CSC).
import { useEffect, useRef, useState } from "react";
import styles from "./Order.module.css";
import { GRADE } from "@/data/Grade";

const LABEL = { kadarAir: "Kadar Air", kadarAbu: "Kadar Abu", zatTerbang: "Zat Terbang", karbonTetap: "Karbon Tetap", nilaiKalori: "Nilai Kalori" };
const persenTeks = (n) => `+${String(n).replace(".", ",")}%`;

// [SECTION: GRADE-PICKER] dipakai di kartu produk DAN di form order (state dipegang Products)
export default function GradePicker({ value, onChange, tampilSpek = true }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const tutup = (e) => { if (!ref.current?.contains(e.target)) setBuka(false); };
    const esc = (e) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", tutup);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", tutup);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  const g = GRADE.find((x) => x.kode === value) ?? null; // null = None
  const pilih = (kode) => { onChange(kode); setBuka(false); };

  return (
    <div>
      <div className={styles.selWrap} ref={ref}>
        <button type="button" className={styles.selBtn} aria-haspopup="listbox" aria-expanded={buka}
          aria-label="Pilihan grade" onClick={() => setBuka((b) => !b)}>
          {g ? (
            <>
              <span className={styles.selNama}>{g.nama}</span>
              <span className={styles.selSingkat}>{persenTeks(g.persen)}</span>
            </>
          ) : (
            <span className={styles.selKosong}>None</span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: buka ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", flex: "none" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {buka && (
          <div className={styles.selDrop} role="listbox" aria-label="Pilihan grade">
            <button type="button" role="option" aria-selected={!g}
              className={`${styles.selOpt} ${!g ? styles.selAktif : ""}`} onClick={() => pilih("")}>
              <span className={styles.selNama}>None</span>
              <span className={styles.selSingkat}>harga dasar</span>
            </button>
            {GRADE.map((x) => (
              <button key={x.kode} type="button" role="option" aria-selected={x.kode === value}
                className={`${styles.selOpt} ${x.kode === value ? styles.selAktif : ""}`} onClick={() => pilih(x.kode)}>
                <span className={styles.selNama}>{x.nama}</span>
                <span className={styles.selSingkat}>{persenTeks(x.persen)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {tampilSpek && g && (
        <div className={styles.spek}>
          {Object.entries(g.spek).map(([k, v]) => (
            <div key={k}><span>{LABEL[k]}</span><b>{v}</b></div>
          ))}
        </div>
      )}
    </div>
  );
}
// [/SECTION: GRADE-PICKER]
