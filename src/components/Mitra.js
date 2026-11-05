// [FILE: src/components/Mitra.js]
// Mitra.js

// [SECTION: DATA-MITRA] tambah mitra baru di akhir array (pakai koma)
export const partnersData = [
  {
    // [SECTION: IDENTITAS]
    id: "tka",
    name: "PT. TUNAS KEMBAR ABADI",
    logo: "/mitra/TunasKembarAbadi/TunasKembarAbadi.png",
    date: "19 Agustus 2026",
    badges: ["Verified", "Supplier"],
    // [/SECTION: IDENTITAS]

    // [SECTION: LEGAL]
    skKemenkumham: "AHU-A114664.AH.01.30.TAHUN 2026",
    tglPendirian: "19 AGUSTUS 2026",
    nib: "1908260098691",
    npwp: "1000000010800297",
    hsCode: "4402.20.10",
    // [/SECTION: LEGAL]

    // [SECTION: ALAMAT]
    alamatKantor: "Kemiri Muka, Beji, Kota Depok, Jawa Barat 16423",
    alamatOperasional: "Tajur, Kec. Citeureup, Kabupaten Bogor, Jawa Barat 16810",
    // [/SECTION: ALAMAT]

    // [SECTION: REKENING] dipakai OrderForm (info pembayaran)
    bank: "BCA Bank Central Asia",
    anRekening: "PT. Tunas Kembar Abadi",
    noRekening: "8692824902",
    swiftCode: "CENAIDJA",
    // [/SECTION: REKENING]

    // [SECTION: DIREKTUR] direktur = Penanggung Jawab di OrderForm
    direktur: "ARVIN MAOLANA HIDAYATTULLOH",
    jabatan: "Direktur",
    nik: "3304031108040002",
    // [/SECTION: DIREKTUR]

    // [SECTION: KONTAK]
    phone: "0851-6815-2525",
    email: "tunaskembarabadi@gmail.com",
    mapsLink: "https://maps.app.goo.gl/JYLr9eo5BByxD5aV6?g_st=ac",
    driveLink: "https://drive.google.com",
    embedMap: "https://maps.google.com/maps?q=-6.536306,106.892095&t=&z=15&ie=UTF8&iwloc=&output=embed",
    // [/SECTION: KONTAK]

    // [SECTION: ORDER-FIELD] dipakai OrderForm
    fotoPJ: "https://www.coconutshellcharcoal.id/founder.jpg", // sementara; nanti ganti ke /mitra/TunasKembarAbadi/Direktur.jpg (rasio 1:1)
    qris: "/mitra/TunasKembarAbadi/QRIS.png",       // gambar QRIS mitra
    // [/SECTION: ORDER-FIELD]

    // [SECTION: GALERI]
    images: [
      { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Stok Arang Batok Kelapa" },
      { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Gudang Penyimpanan" },
      { src: "/mitra/TunasKembarAbadi/Stock.jpg", alt: "Proses Produksi" },
    ],
    // [/SECTION: GALERI]
  },

  // Tambahkan objek mitra lainnya di sini menggunakan koma
  // , { id: "mitra2", name: "PT. MITRA DUA", ... }
];
// [/SECTION: DATA-MITRA]
