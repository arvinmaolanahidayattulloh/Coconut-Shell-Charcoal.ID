"use client";
// [FILE: src/components/ProviderSelect.js]
// Pilihan Bank / E-Wallet: hanya LOGO (tanpa nama). Di dalam daftar ada kolom cari; mengetik menyaring logo,
// dan tombol cari / Enter memilih provider bila hasilnya tepat satu.
import { useEffect, useRef, useState } from "react";
import styles from "./Order.module.css";
import rev from "./OrderRevisi.module.css";

// Logo provider; bila file belum ada di public/pembayaran/provider/ → tampil inisial
export function LogoProvider({ p, besar = false }) {
  const [gagal, setGagal] = useState(false);
  const kelas = besar ? ` ${styles.logoBesar}` : "";
  if (gagal) return <span className={`${styles.logoCadangan}${kelas}`} role="img" aria-label={p.nama}>{p.singkat.slice(0, 3)}</span>;
  return <img src={p.logo} alt={p.nama} title={p.nama} className={`${styles.logoProvider}${kelas}`} onError={() => setGagal(true)} />;
}

export default function ProviderSelect({ daftar, value, onChange, placeholder = "Pilih", ariaLabel }) {
  const [buka, setBuka] = useState(false);
  const [kata, setKata] = useState("");
  const ref = useRef(null);
  const cariRef = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const tutup = (e) => { if (!ref.current?.contains(e.target)) setBuka(false); };
    const esc = (e) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", tutup);
    document.addEventListener("keydown", esc);
    cariRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", tutup);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  const terpilih = daftar.find((p) => p.kode === value) ?? null;
  const k = kata.trim().toLowerCase();
  const tampil = k
    ? daftar.filter((p) => [p.nama, p.singkat, p.kode].some((s) => s.toLowerCase().includes(k)))
    : daftar;

  const pilih = (kode) => { onChange(kode); setBuka(false); setKata(""); };
  // tombol cari / Enter: menentukan bank bila hasil pencarian tepat satu
  const tentukan = () => { if (tampil.length === 1) pilih(tampil[0].kode); };

  return (
    <div className={styles.selWrap} ref={ref}>
      <button type="button" className={styles.selBtn} aria-haspopup="listbox" aria-expanded={buka}
        aria-label={terpilih ? `${ariaLabel}: ${terpilih.nama}` : ariaLabel} onClick={() => setBuka((b) => !b)}>
        {terpilih ? (
          <span className={styles.selNama}><LogoProvider key={terpilih.kode} p={terpilih} besar /></span>
        ) : (
          <span className={styles.selKosong}>{placeholder}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: buka ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", flex: "none" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {buka && (
        <div className={styles.selDrop} role="listbox" aria-label={ariaLabel}>
          <div className={rev.cariRow}>
            <input ref={cariRef} className={rev.cariInput} value={kata} onChange={(e) => setKata(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tentukan(); } }}
              placeholder="Cari…" aria-label="Cari" autoComplete="off" />
            <button type="button" className={rev.cariBtn} onClick={tentukan} aria-label="Cari dan pilih">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
            </button>
          </div>
          {tampil.length ? (
            <div className={rev.logoGrid}>
              {tampil.map((p) => (
                <button key={p.kode} type="button" role="option" aria-selected={p.kode === value} aria-label={p.nama} title={p.nama}
                  className={`${rev.logoOpt} ${p.kode === value ? rev.logoOptAktif : ""}`}
                  onClick={() => pilih(p.kode)}>
                  <LogoProvider p={p} besar />
                </button>
              ))}
            </div>
          ) : (
            <div className={rev.tidakAda}>Tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
}
