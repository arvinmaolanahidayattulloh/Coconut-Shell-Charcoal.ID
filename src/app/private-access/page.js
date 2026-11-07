import Invest from "@/components/Invest";
import Index from "@/components/Index";
import HargaFeed from "@/components/HargaFeed";

export const metadata = {
  title: "Private Access | CSCID",
  description: "Akses privat Invest CSCID dan Index CSCID.",
  robots: { index: false, follow: false },
};

export default function PrivateAccessPage() {
  return (
    <main>
      <Invest />
      <Index />
      <HargaFeed />
    </main>
  );
}
