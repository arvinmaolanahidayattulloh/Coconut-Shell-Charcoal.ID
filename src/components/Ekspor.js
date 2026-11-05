"use client";
// [FILE: src/components/Ekspor.js]
import OrderForm from "./OrderForm";
import s from "./Ekspor.module.css";

// [SECTION: CONFIG-EKSPOR] aturan khusus Ekspor, ubah di sini
// mode    : "ekspor" → harga dalam USD per Ton
// satuan  : Ton
// min     : minimal order (Ton) → 25 Ton (± 5.000 USD)
// catatan : teks kecil di bawah judul form
const CONFIG = {
  mode: "ekspor",
  judul: "Ekspor",
  satuan: "Ton",
  min: 25,
  catatan: "Harga dalam USD per Ton · minimal order 25 Ton",
};
// [/SECTION: CONFIG-EKSPOR]

// [SECTION: KOMPONEN-EKSPOR] sisa props (grade, onGradeChange, dst.) diteruskan ke OrderForm
export default function Ekspor({ produk = "Natural", ...sisa }) {
  return <OrderForm config={CONFIG} className={s.root} produk={produk} {...sisa} />;
}
// [/SECTION: KOMPONEN-EKSPOR]
