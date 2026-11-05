import { NextResponse } from "next/server";
import { totalStockInvestor } from "@/lib/csc/invest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { totalTon, jumlahInvestor } = await totalStockInvestor();
    return NextResponse.json({ ok: true, totalTon, jumlahInvestor }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, pesan: "Gagal mengambil data investasi" }, { status: 500 });
  }
}
