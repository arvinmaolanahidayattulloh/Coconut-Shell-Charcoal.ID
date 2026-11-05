// [FILE: src/data/Provider.js]
// Daftar pilihan Bank / E-Wallet untuk form order (pembeli TIDAK mengetik bebas).
// Logo: SVG di public/pembayaran/provider/ (sumber: github.com/hafidznoor/idn-finlogos, aset CC BY-NC 4.0 —
// lihat LICENSE-ASSETS.txt dan NOTICE.txt di folder itu; merek tetap milik masing-masing pemegangnya).
// Bila file hilang, form menampilkan inisial sebagai cadangan.

// [SECTION: BANK]
export const BANK = [
  { kode: "bca",     nama: "Bank Central Asia",         singkat: "BCA",        logo: "/pembayaran/provider/bca.svg" },
  { kode: "mandiri", nama: "Bank Mandiri",              singkat: "Mandiri",    logo: "/pembayaran/provider/mandiri.svg" },
  { kode: "bri",     nama: "Bank Rakyat Indonesia",     singkat: "BRI",        logo: "/pembayaran/provider/bri.svg" },
  { kode: "bni",     nama: "Bank Negara Indonesia",     singkat: "BNI",        logo: "/pembayaran/provider/bni.svg" },
  { kode: "bsi",     nama: "Bank Syariah Indonesia",    singkat: "BSI",        logo: "/pembayaran/provider/bsi.svg" },
  { kode: "cimb",    nama: "CIMB Niaga",                singkat: "CIMB",       logo: "/pembayaran/provider/cimb-niaga.svg" },
  { kode: "permata", nama: "Bank Permata",              singkat: "Permata",    logo: "/pembayaran/provider/permata.svg" },
  { kode: "danamon", nama: "Bank Danamon",              singkat: "Danamon",    logo: "/pembayaran/provider/danamon.svg" },
  { kode: "ocbc",    nama: "OCBC",                      singkat: "OCBC",       logo: "/pembayaran/provider/ocbc-nisp.svg" },
  { kode: "maybank", nama: "Maybank Indonesia",         singkat: "Maybank",    logo: "/pembayaran/provider/maybank.svg" },
];
// [/SECTION: BANK]

// [SECTION: EWALLET]
export const EWALLET = [
  { kode: "gopay",     nama: "GoPay",     singkat: "GoPay",     logo: "/pembayaran/provider/gopay.svg" },
  { kode: "ovo",       nama: "OVO",       singkat: "OVO",       logo: "/pembayaran/provider/ovo.svg" },
  { kode: "dana",      nama: "DANA",      singkat: "DANA",      logo: "/pembayaran/provider/dana.svg" },
  { kode: "shopeepay", nama: "ShopeePay", singkat: "ShopeePay", logo: "/pembayaran/provider/shopee-pay.svg" },
  { kode: "linkaja",   nama: "LinkAja",   singkat: "LinkAja",   logo: "/pembayaran/provider/linkaja.svg" },
];
// [/SECTION: EWALLET]

// [SECTION: CARI] cocokkan teks bebas (mis. "BCA Bank Central Asia") ke provider di atas
export function cariProvider(teks) {
  const t = String(teks || "").toLowerCase();
  if (!t) return null;
  return [...BANK, ...EWALLET].find((p) => t.includes(p.singkat.toLowerCase()) || t.includes(p.nama.toLowerCase())) ?? null;
}
// [/SECTION: CARI]
