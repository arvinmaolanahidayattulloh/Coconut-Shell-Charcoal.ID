
// [CSC:API] GET /api/csc?iv=1d&limit=1000&before=<UTC detik>
// Waktu dikembalikan UTC detik; browser yang menambah offset WIB.
import { NextResponse } from "next/server";
import { getCsc } from "@/lib/csc/db";
import { INTERVALS } from "@/lib/csc/formula";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const iv = searchParams.get("iv") || "1d";
  if (!INTERVALS.includes(iv)) {
    return NextResponse.json({ error: "interval tidak dikenal" }, { status: 400 });
  }

  const limit = Math.min(Math.max(parseInt(searchParams.get("limit"), 10) || 1000, 1), 1000);

  const beforeRaw = searchParams.get("before");
  const before = beforeRaw ? Number(beforeRaw) : null;
  if (beforeRaw && !isFinite(before)) {
    return NextResponse.json({ error: "before tidak valid" }, { status: 400 });
  }

  try {
    const rows = await getCsc(iv, limit, before);
    const candles = rows.map((r) => ({ t: Number(r.t), o: r.o, h: r.h, l: r.l, c: r.c }));

    // [CSC:API-CACHE] halaman lama tidak berubah -> cache panjang; halaman terbaru -> pendek
    const cache = before
      ? "public, s-maxage=3600, stale-while-revalidate=86400"
      : "public, s-maxage=30, stale-while-revalidate=60";
    // [/CSC:API-CACHE]

    return NextResponse.json(
      {
        iv,
        candles,
        oldest: candles.length ? candles[0].t : null,
        hasMore: candles.length === limit,
      },
      { headers: { "Cache-Control": cache } }
    );
  } catch (e) {
    return NextResponse.json({ error: "gagal membaca data" }, { status: 500 });
  }
}
// [/CSC:API]
