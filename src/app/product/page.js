// [FILE: src/app/product/page.js]
// Halaman khusus produk: CoconutShellCharcoal.id/product
import Header from "@/components/Header";
import Products from "@/components/Products";
import HargaFeed from "@/components/HargaFeed";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Produk | Coconut Shell Charcoal Indonesia",
  description: "Katalog produk arang tempurung kelapa dengan harga realtime mengikuti indeks pasar.",
};

export default function ProductPage() {
  return (
    <>
      <Header />
      <div className="pageFlexLayout">
        <div className="mainLayoutContainer">
          <main style={{ paddingTop: 96 }}>
            <Products />
            {/* harga realtime Products diisi PriceChart; di halaman ini dipasang di luar layar */}
            <HargaFeed />
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
