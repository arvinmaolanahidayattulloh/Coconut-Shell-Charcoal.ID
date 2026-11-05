// [FILE: src/app/certificate/page.js] CoconutShellCharcoal.id/certificate
import HalamanBagian from "@/components/HalamanBagian";
import { HALAMAN_PERUSAHAAN } from "@/data/Halaman";

const h = HALAMAN_PERUSAHAAN.find((x) => x.href === "/certificate");

export const metadata = { title: `${h.label} | Coconut Shell Charcoal Indonesia`, description: h.deskripsi };

export default function Page() {
  return <HalamanBagian judul={h.label} deskripsi={h.deskripsi} />;
}
