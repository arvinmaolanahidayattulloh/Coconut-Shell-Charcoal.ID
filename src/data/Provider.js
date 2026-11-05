// [FILE: src/data/Provider.js]
// Daftar pilihan Bank / E-Wallet untuk form order (pembeli TIDAK mengetik bebas).
// Logo: taruh file di public/pembayaran/provider/ dengan nama persis seperti `logo` di bawah,
// mis. public/pembayaran/provider/LogoBCA.png. Bila file belum ada, form menampilkan inisial sebagai cadangan.

// [SECTION: BANK]
export const BANK = [
  { kode: "bca",     nama: "Bank Central Asia",         singkat: "BCA",        logo: "/pembayaran/provider/LogoBCA.png" },
  { kode: "mandiri", nama: "Bank Mandiri",              singkat: "Mandiri",    logo: "/pembayaran/provider/LogoMandiri.png" },
  { kode: "bri",     nama: "Bank Rakyat Indonesia",     singkat: "BRI",        logo: "/pembayaran/provider/LogoBRI.png" },
  { kode: "bni",     nama: "Bank Negara Indonesia",     singkat: "BNI",        logo: "/pembayaran/provider/LogoBNI.png" },
  { kode: "bsi",     nama: "Bank Syariah Indonesia",    singkat: "BSI",        logo: "/pembayaran/provider/LogoBSI.png" },
  { kode: "cimb",    nama: "CIMB Niaga",                singkat: "CIMB",       logo: "/pembayaran/provider/LogoCIMB.png" },
  { kode: "permata", nama: "Bank Permata",              singkat: "Permata",    logo: "/pembayaran/provider/LogoPermata.png" },
  { kode: "danamon", nama: "Bank Danamon",              singkat: "Danamon",    logo: "/pembayaran/provider/LogoDanamon.png" },
  { kode: "ocbc",    nama: "OCBC",                      singkat: "OCBC",       logo: "/pembayaran/provider/LogoOCBC.png" },
  { kode: "maybank", nama: "Maybank Indonesia",         singkat: "Maybank",    logo: "/pembayaran/provider/LogoMaybank.png" },
];
// [/SECTION: BANK]

// [SECTION: EWALLET]
export const EWALLET = [
  { kode: "gopay",     nama: "GoPay",     singkat: "GoPay",     logo: "/pembayaran/provider/LogoGoPay.png" },
  { kode: "ovo",       nama: "OVO",       singkat: "OVO",       logo: "/pembayaran/provider/LogoOVO.png" },
  { kode: "dana",      nama: "DANA",      singkat: "DANA",      logo: "/pembayaran/provider/LogoDANA.png" },
  { kode: "shopeepay", nama: "ShopeePay", singkat: "ShopeePay", logo: "/pembayaran/provider/LogoShopeePay.png" },
  { kode: "linkaja",   nama: "LinkAja",   singkat: "LinkAja",   logo: "/pembayaran/provider/LogoLinkAja.png" },
];
// [/SECTION: EWALLET]
