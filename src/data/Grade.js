// [FILE: src/data/Grade.js]
// [SECTION: DAFTAR-GRADE] ubah spek sendiri di sini
export const GRADE = [
  { kode: "A", nama: "Grade A", persen: 5,   spek: { kadarAir: "—", kadarAbu: "—", zatTerbang: "—", karbonTetap: "—", nilaiKalori: "—" } },
  { kode: "B", nama: "Grade B", persen: 2.5, spek: { kadarAir: "—", kadarAbu: "—", zatTerbang: "—", karbonTetap: "—", nilaiKalori: "—" } },
  { kode: "C", nama: "Grade C", persen: 0,   spek: { kadarAir: "—", kadarAbu: "—", zatTerbang: "—", karbonTetap: "—", nilaiKalori: "—" } },
];
// [/SECTION: DAFTAR-GRADE]

// [SECTION: PRODUK-BERGRADE] hanya produk ini yang punya pilihan Grade (nama sama dengan PRODUCTS di Products.js)
export const PRODUK_BERGRADE = ["Natural"];
export const GRADE_AWAL = ""; // None = belum memilih grade → tampil harga dasar indeks CSC (+0%)
// [/SECTION: PRODUK-BERGRADE]
