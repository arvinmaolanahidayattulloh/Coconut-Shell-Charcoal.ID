// [CSC:CRON-ROUTE] pemicu manual / cadangan. Pembaruan utama berjalan lewat GitHub Actions.
// Wajib header:  Authorization: Bearer <CRON_SECRET>  (Vercel Cron mengirimnya otomatis bila CRON_SECRET diatur)
import { NextResponse } from "next/server";
import { runUpdate } from "@/lib/csc/update";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await runUpdate({ budgetMs: 45000 });
    return NextResponse.json(r, { status: r.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ error: "gagal memperbarui" }, { status: 500 });
  }
}
// [/CSC:CRON-ROUTE]

