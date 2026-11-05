// [FILE: src/app/chart/page.js]
// Halaman khusus chart harga: CoconutShellCharcoal.id/chart
import Header from "@/components/Header";
import PriceChart from "@/components/PriceChart";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Chart Harga CSC | Coconut Shell Charcoal Indonesia",
  description: "Chart harga indeks arang tempurung kelapa (CSC) secara realtime.",
};

export default function ChartPage() {
  return (
    <>
      <Header />
      <div className="pageFlexLayout">
        <div className="mainLayoutContainer">
          <main style={{ paddingTop: 96 }}>
            <PriceChart />
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
