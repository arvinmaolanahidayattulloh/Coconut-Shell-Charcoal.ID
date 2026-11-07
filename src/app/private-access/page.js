import PrivateAccessClient from "@/components/PrivateAccessClient";

export const metadata = {
  title: "Private Access | CSCID",
  description: "Akses privat Invest CSCID dan Index CSCID.",
  robots: { index: false, follow: false },
};

export default function PrivateAccessPage() {
  return <PrivateAccessClient />;
}
