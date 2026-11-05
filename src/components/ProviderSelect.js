"use client";
// [FILE: src/components/ProviderSelect.js]
// Pilihan Bank / E-Wallet berbentuk select (tombol + daftar turun), sama gayanya dengan pilihan mata uang di Price Chart.
import { useEffect, useRef, useState } from "react";
import styles from "./Order.module.css";

// Logo provider; bila file belum ada di public/pembayaran/provider/ → tampil inisial
export function LogoProvider({ p, besar = false }) {
  const [gagal, setGagal] = useState(false);
  const kelas = besar ? ` ${styles.logoBesar}` : "";
  if (gagal) return <span className={`${styles.logoCadangan}${kelas}`} aria-hidden="true">{p.singkat.slice(0, 3)}</span>;
  return <img src={p.logo} alt={besar ? p.nama : ""} className={`${styles.logoProvider}${kelas}`} onError={() => setGagal(true)} />;
}

export default function ProviderSelect({ daftar, value, onChange, placeholder = "Pilih", ariaLabel }) {
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

  const terpilih = daftar.find((p) => p.kode === value) ?? null;

  return (
    <div className={styles.selWrap} ref={ref}>
      <button type="button" className={styles.selBtn} aria-haspopup="listbox" aria-expanded={buka}
        aria-label={ariaLabel} onClick={() => setBuka((b) => !b)}>
        {terpilih ? (
          <>
            <LogoProvider key={terpilih.kode} p={terpilih} />
            <span className={styles.selNama}>{terpilih.nama}</span>
          </>
        ) : (
          <span className={styles.selKosong}>{placeholder}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: buka ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", flex: "none" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {buka && (
        <div className={styles.selDrop} role="listbox">
          {daftar.map((p) => (
            <button key={p.kode} type="button" role="option" aria-selected={p.kode === value}
              className={`${styles.selOpt} ${p.kode === value ? styles.selAktif : ""}`}
              onClick={() => { onChange(p.kode); setBuka(false); }}>
              <LogoProvider p={p} />
              <span className={styles.selNama}>{p.nama}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
