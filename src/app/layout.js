

export const metadata = {
  title: "NeoKarbon Indonesia - Produsen Briket Batu Bara & Arang Premium",
  description: "NeoKarbon Indonesia adalah produsen dan distributor briket batu bara serta arang berkualitas tinggi untuk kebutuhan industri, restoran, dan ekspor internasional. Sertifikasi ISO 9001.",
  keywords: "briket batu bara, arang briket, charcoal briquette, produsen briket, ekspor briket, briket industri, NeoKarbon Indonesia",
  openGraph: {
    title: "NeoKarbon Indonesia - Briket Batu Bara Premium",
    description: "Solusi energi terpercaya dengan briket batu bara dan arang berkualitas tinggi. 10+ tahun pengalaman, 500+ klien industri.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1764656449083941"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
