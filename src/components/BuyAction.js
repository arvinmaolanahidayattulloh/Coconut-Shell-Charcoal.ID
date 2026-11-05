"use client";
// [FILE: src/components/BuyAction.jsx]
import styles from "./Order.module.css";
import Ekspor from "./Ekspor";
import Domestik from "./Domestik";

// [SECTION: BUY-ACTION] di kartu Produk hanya TOMBOL. State `mode` dipegang Products.
// belum login → Buy lama; sudah login → tombol Ekspor / Domestik
export default function BuyAction({ isLoggedIn, onBuyGuest, mode, onMode }) {
  if (!isLoggedIn) return <button type="button" className={styles.tombolAksi} onClick={onBuyGuest}>Buy</button>;
  return (
    <div className={styles.aksi}>
      <button type="button" className={`${styles.tombolAksi} ${mode === "ekspor" ? styles.aktif : ""}`} onClick={() => onMode("ekspor")}>Ekspor</button>
      <button type="button" className={`${styles.tombolAksi} ${mode === "domestik" ? styles.aktif : ""}`} onClick={() => onMode("domestik")}>Domestik</button>
    </div>
  );
}
// [/SECTION: BUY-ACTION]

// [SECTION: ORDER-PANEL] form order, dirender Products DI BAWAH section Produk
// sisa props (produk, hargaTonIdr, usdIdr, onSelesai, grade, onGradeChange) diteruskan ke form
export function OrderPanel({ mode, ...sisa }) {
  if (mode === "ekspor") return <Ekspor {...sisa} />;
  if (mode === "domestik") return <Domestik {...sisa} />;
  return null;
}
// [/SECTION: ORDER-PANEL]
