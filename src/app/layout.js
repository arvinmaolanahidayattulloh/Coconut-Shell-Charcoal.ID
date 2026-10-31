import "./globals.css";

export const metadata = {
  title: "Coconut Shell Charcoal Indonesia",
  description: "Didirikan pada 30 Oktober 2026.",
  keywords: "arang tempurung kelapa, coconut shell charcoal, charcoal briquette, produsen arang, ekspor arang kelapa, PT Tunas Kembar Abadi",
  icons: {
    icon: "/Coconut-Shell-Charcoal.ID.png",
  },
  openGraph: {
    title: "Coconut Shell Charcoal Indonesia",
    description: "Kebutuhan Industri, Restoran, dan Ekspor Internasional.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1764656449083941"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
