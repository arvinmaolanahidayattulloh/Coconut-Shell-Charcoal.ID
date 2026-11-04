"use client";
// [FILE: src/components/Domestik.js]
import OrderForm from "./OrderForm";
import s from "./Domestik.module.css";

// [SECTION: CONFIG-DOMESTIK] aturan khusus Domestik, ubah di sini
// mode   : "domestik" → harga dalam Rupiah per Kg
// satuan : Kg
// min    : minimal order (Kg)
const CONFIG = { mode: "domestik", judul: "Domestik", satuan: "Kg", min: 100 };
// [/SECTION: CONFIG-DOMESTIK]

// [SECTION: KOMPONEN-DOMESTIK]
export default function Domestik({ produk = "Natural", hargaTonIdr, usdIdr, onSelesai }) {
  return (
    <OrderForm
      config={CONFIG}
      className={s.root}
      produk={produk}
      hargaTonIdr={hargaTonIdr}
      usdIdr={usdIdr}
      onSelesai={onSelesai}
    />
  );
}
// [/SECTION: KOMPONEN-DOMESTIK]
