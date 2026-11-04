"use client";
// [FILE: src/components/Ekspor.js]
import OrderForm from "./OrderForm";
import s from "./Ekspor.module.css";

// [SECTION: CONFIG-EKSPOR] aturan khusus Ekspor, ubah di sini
// mode   : "ekspor" → harga dalam USD per Ton
// satuan : Ton
// min    : minimal order (Ton)
const CONFIG = { mode: "ekspor", judul: "Ekspor", satuan: "Ton", min: 1 };
// [/SECTION: CONFIG-EKSPOR]

// [SECTION: KOMPONEN-EKSPOR]
export default function Ekspor({ produk = "Natural", hargaTonIdr, usdIdr, onSelesai }) {
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
// [/SECTION: KOMPONEN-EKSPOR]
