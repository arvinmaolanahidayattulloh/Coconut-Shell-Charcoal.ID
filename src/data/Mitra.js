// [FILE: src/data/Mitra.js]
// Adapter: sumber data tunggal tetap src/components/Mitra.js (partnersData).
// OrderForm membaca bentuk MITRA di bawah ini, jadi tidak perlu data ganda.
import { partnersData } from "@/components/Mitra";

// [SECTION: MAP-MITRA]
export const MITRA = partnersData.map((p) => {
  const rekening = { bank: p.bank, noRek: p.noRekening, atasNama: p.anRekening };
  return {
    id: p.id,
    nama: p.name,
    logo: p.logo,
    // legal: ditampilkan di form order agar pembeli bisa memeriksa keabsahan broker
    ahu: p.skKemenkumham,
    nib: p.nib,
    alamat: p.alamatKantor,
    maps: p.mapsLink,
    alamatOps: p.alamatOperasional,
    embedMap: p.embedMap,
    penanggungJawab: { nama: p.direktur, jabatan: p.jabatan, wa: p.phone, foto: p.fotoPJ },
    pembayaran: {
      // SWIFT hanya relevan untuk transfer ekspor (USD)
      transfer: {
        ekspor: { ...rekening, swift: p.swiftCode },
        domestik: rekening,
      },
      qris: p.qris,
    },
  };
});
// [/SECTION: MAP-MITRA]
