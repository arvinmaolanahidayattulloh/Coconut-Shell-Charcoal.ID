// [FILE: src/app/galery/page.js] CoconutShellCharcoal.id/galery
import HalamanBagian from "@/components/HalamanBagian";
import { HALAMAN_PERUSAHAAN } from "@/data/Halaman";

const h = HALAMAN_PERUSAHAAN.find((x) => x.href === "/galery");

export const metadata = { title: `${h.label} | Coconut Shell Charcoal Indonesia`, description: h.deskripsi };

export default function Page() {
  return <HalamanBagian judul={h.label} deskripsi={h.deskripsi} />;
}
