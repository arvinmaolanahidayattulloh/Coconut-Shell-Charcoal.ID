// [FILE: src/lib/csc/harga.js]
// Hitung harga order dari harga yang tampil di Products (Rupiah per TON) + persen grade.
//
//   domestik : Rupiah per Kg  = hargaTonIdr / 1000 × (1 + persen/100)
//   ekspor   : USD per Ton    = hargaTonIdr / usdIdr × (1 + persen/100)
//
// Satuan dibulatkan dulu (Rp utuh / 2 desimal USD), lalu total = satuan × qty,
// sehingga angka di invoice selalu cocok jika dikalikan.
// Mengembalikan null bila data belum lengkap → OrderForm menampilkan "Memuat harga…".

// [SECTION: HITUNG]
export function hitungHarga({ mode, hargaTonIdr, usdIdr, persen = 0, qty = 0 }) {
  if (!(hargaTonIdr > 0)) return null;
  const faktor = 1 + (Number(persen) || 0) / 100;
  const jumlah = Number(qty) > 0 ? Number(qty) : 0;

  if (mode === "domestik") {
    const satuan = Math.round((hargaTonIdr / 1000) * faktor);
    return { mataUang: "IDR", satuan, total: satuan * jumlah };
  }
  if (mode === "ekspor") {
    if (!(usdIdr > 0)) return null;
    const satuan = Math.round((hargaTonIdr / usdIdr) * faktor * 100) / 100;
    return { mataUang: "USD", satuan, total: Math.round(satuan * jumlah * 100) / 100 };
  }
  return null;
}
// [/SECTION: HITUNG]

// [SECTION: FORMAT] sama dengan Products: id-ID, "Rp" tanpa spasi, Rupiah tanpa desimal
export function formatUang(nilai, mataUang = "IDR") {
  if (mataUang === "USD") {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(nilai);
  }
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(nilai);
}
// [/SECTION: FORMAT]
