// [FILE: src/components/HalamanBagian.js]
// Kerangka halaman perusahaan (Karier, Blog, Certificate, Galery) yang dibuka dari Header / Footer di tab baru.
// Isi halaman masih "segera hadir"; ganti blok <main> di bawah dengan konten sebenarnya.
import Header from "./Header";
import Footer from "./Footer";

export default function HalamanBagian({ judul, deskripsi }) {
  return (
    <>
      <Header />
      <div className="pageFlexLayout">
        <div className="mainLayoutContainer">
          <main className="wrap" style={{ paddingTop: 140, paddingBottom: 64, minHeight: "60vh" }}>
            <span className="eyebrow">Perusahaan</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.03em", margin: "8px 0 14px" }}>
              {judul}
            </h1>
            <p style={{ maxWidth: 560, lineHeight: 1.6, color: "var(--color-graphite)" }}>{deskripsi}</p>
            <p style={{ marginTop: 24, color: "var(--color-stone)" }}>Halaman ini sedang disiapkan. Segera hadir.</p>
            <a href="/" style={{ display: "inline-block", marginTop: 20, fontWeight: 600, color: "var(--color-ember)" }}>Ke beranda</a>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
