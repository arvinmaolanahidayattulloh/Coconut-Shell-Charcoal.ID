// [FILE: src/data/investOptions.js] Data statis form Invest (dipindah dari invest.page.js, isi TIDAK diubah).
// [SECTION:PAYMENT-CATEGORIES]
export const PAYMENT_CATEGORIES = [
  {
    category: "Transfer Bank Resmi",
    items: [
      { name: "Bank Central Asia", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia_logo.svg" },
      { name: "Bank Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
      { name: "Bank Negara Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_BNI.svg" },
      { name: "Bank Rakyat Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Logo_Bank_Rakyat_Indonesia.svg" },
      { name: "Bank Syariah Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia_logo.svg" },
      { name: "CIMB Niaga", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b3/CIMB_Niaga_logo.svg" },
      { name: "Bank Permata", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/PermataBank_logo.svg" },
      { name: "Bank Danamon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Bank_Danamon_logo.svg" },
      { name: "Bank Tabungan Negara", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Bank_BTN_logo.svg" },
      { name: "Bank Mega", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Bank_Mega_logo.svg" },
      { name: "OCBC NISP", logo: "https://upload.wikimedia.org/wikipedia/commons/7/77/OCBC_logo_2023.svg" },
      { name: "Panin Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/PaninBank_logo.svg" },
      { name: "Bank Jago", logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/Bank_Jago_logo.svg" },
      { name: "SeaBank Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/SeaBank_Logo.svg" },
      { name: "Bank Neo Commerce", logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Bank_Neo_Commerce_logo.svg" },
      { name: "BCA Syariah", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia_logo.svg" },
      { name: "Bank Muamalat", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Bank_Muamalat_Indonesia_logo.svg" },
      { name: "BTPN / Jenius", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fc/BTPN_logo_2019.svg" },
      { name: "Maybank Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Maybank_logo.svg" },
      { name: "Bank Jabar Banten", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bank_BJB_logo.svg" },
      { name: "Bank DKI", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Logo_Bank_DKI.svg" }
    ]
  },
  {
    category: "Dompet Digital (E-Wallet)",
    items: [
      { name: "Dana", logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" },
      { name: "Gopay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
      { name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg" },
      { name: "LinkAja", logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/LinkAja_logo.svg" }
    ]
  }
];
// [/SECTION:PAYMENT-CATEGORIES]

// [SECTION:EWALLET-CHECK] menggantikan 8 pemanggilan .includes() berulang di JSX (hasil sama)
const EWALLET_KEYS = ["dana", "gopay", "ovo", "linkaja"];
export const isEwallet = (name = "") => EWALLET_KEYS.some((k) => name.toLowerCase().includes(k));
// [/SECTION:EWALLET-CHECK]

// [SECTION:TERMS-TEXT] isi "Baca Detail" syarat & risiko (teks sama dengan sebelumnya)
export const SYARAT_RISIKO = [
  { judul: "Risiko Fluktuasi Pasar", isi: "Nilai investasi komoditas dapat berubah sewaktu-waktu tergantung pada dinamika pasar global." },
  { judul: "Regulasi Ekspor", isi: "Proses distribusi komoditas dipengaruhi oleh regulasi internasional serta jalur logistik." },
  { judul: "Kebijakan Dana", isi: "Dana yang dialokasikan tidak dapat ditarik kembali secara sepihak." }
];
// [/SECTION:TERMS-TEXT]

// [SECTION:VERIFY-METHODS]
export const METODE_VERIFIKASI = ["Passkey", "Authenticator", "Email", "WhatsApp"];
// [/SECTION:VERIFY-METHODS]
