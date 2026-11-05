// [FILE: src/app/api/device-ip/route.js]
// Mengembalikan IP perangkat pemanggil (dari header proxy Vercel). Di localhost hasilnya kosong / 127.0.0.1.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  const h = req.headers;
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  return NextResponse.json({ ip }, { headers: { "Cache-Control": "no-store" } });
}
