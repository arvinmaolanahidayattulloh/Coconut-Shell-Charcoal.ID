// Satu-satunya tempat untuk mengatur isi & angka Invest.
// Isi `null` = belum ditentukan (tampil sebagai "Akan ditentukan"). Ganti angkanya di sini saja.
export const INVEST_TERMS = {
  satuan: "Ton",
  hargaJual: null,             // harga jual per Ton (Rp)
  potonganOperasionalPct: null, // % biaya operasional dari hasil penjualan
  bagiHasilInvestorPct: null,   // % bagi hasil untuk investor dari sisa setelah operasional
};

export const tbd = (v, suffix = "") =>
  v === null || v === undefined ? "Akan ditentukan" : `${v}${suffix}`;

export const PERBEDAAN = [
  { baris: "Tujuan", beli: "Memiliki barang untuk dipakai atau dijual sendiri", invest: "Menanam modal pada stok yang dijual oleh CSC" },
  { baris: "Barang", beli: "Dikirim ke pembeli", invest: "Tetap disimpan di gudang CSC" },
  { baris: "Pembayaran", beli: "Transfer atau QRIS", invest: "Transfer atau QRIS (sama)" },
  { baris: "Hasil", beli: "Barang menjadi milik pembeli", invest: "Bagi hasil dari penjualan, setelah biaya operasional" },
];

export const LANGKAH = [
  { judul: "Pilih alokasi", isi: "Tentukan jumlah Ton dan perusahaan penyedia." },
  { judul: "Transfer pembayaran", isi: "Bayar ke rekening resmi penyedia lewat transfer atau QRIS." },
  { judul: "Unggah bukti", isi: "Kirim bukti transfer, lalu verifikasi akun Anda." },
  { judul: "Tunggu konfirmasi", isi: "Tim memeriksa pembayaran dan mengirim rincian lewat WhatsApp." },
];

export const ALUR_HASIL = [
  { judul: "Hasil penjualan", isi: "Seluruh uang dari penjualan stok", nilai: "Harga jual belum ditentukan" },
  { judul: "Biaya operasional", isi: "Dipotong lebih dulu", nilai: tbd(INVEST_TERMS.potonganOperasionalPct, "%") },
  { judul: "Bagi hasil", isi: "Dibagi sesuai alokasi Ton", nilai: tbd(INVEST_TERMS.bagiHasilInvestorPct, "%") },
];
