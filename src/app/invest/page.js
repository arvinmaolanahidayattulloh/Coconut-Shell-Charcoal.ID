// [FILE: src/app/invest/page.js]
// Halaman khusus Invest: CoconutShellCharcoal.id/invest (bagian Invest tetap ada juga di halaman utama, di bawah chart).
import Invest from "@/components/Invest";
import HargaFeed from "@/components/HargaFeed";

export const metadata = {
  title: "Invest | Coconut Shell Charcoal Indonesia",
  description: "Investasi indeks CSCID: alokasi kuota komoditas arang tempurung kelapa.",
};

export default function InvestRoutePage() {
  return (
    <>
      <Invest />
      {/* harga realtime (untuk total investasi) diisi PriceChart; di halaman ini dipasang di luar layar */}
      <HargaFeed />
    </>
  );
}
