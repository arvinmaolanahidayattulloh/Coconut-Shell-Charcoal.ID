"use client";
// [FILE: src/components/AksiBtn.js]
// SATU tombol aksi berbentuk ikon untuk semua popup: lanjut / verifikasi / setujui / simpan / kirim / buka.
// Tidak ada tombol "Kembali" atau "Batal": popup ditutup dengan mengetuk / mengklik di luar kotaknya.
// `label` dipakai sebagai nama tombol untuk pembaca layar dan tooltip (teks tidak ditampilkan).
import styles from "./AksiBtn.module.css";

export default function AksiBtn({ label, type = "submit", busy = false, disabled = false, onClick }) {
  return (
    <button type={type} className={styles.aksi} onClick={onClick} disabled={disabled || busy}
      aria-label={label} aria-busy={busy || undefined} title={label}>
      {busy ? (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9" opacity="0.9">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
          </path>
        </svg>
      ) : (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="5 12.5 10 17.5 19 7.5" />
        </svg>
      )}
    </button>
  );
}
