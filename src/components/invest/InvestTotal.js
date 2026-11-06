"use client";

import React, { useCallback, useEffect, useState } from "react";
import s from "./InvestTotal.module.css";

const fmtTon = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

// Kartu "Total Keseluruhan Stock Investor". Judul bagian sudah ada di InvestIntro, jadi tidak diulang di sini.
export default function InvestTotal() {
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(true);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat("");
    try {
      const r = await fetch("/api/invest/total", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.pesan || "Gagal memuat data");
      setData(j);
    } catch (e) {
      setGalat(e.message || "Gagal memuat data");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  return (
    <section className={s.wrap} aria-label="Total stock investor">
      <div className={s.kartu}>
        <span className={s.label}>Total Keseluruhan Stock Investor</span>
        {galat ? (
          <span className={s.galat} role="alert">{galat}</span>
        ) : memuat && !data ? (
          <span className={s.muat}>Memuat…</span>
        ) : (
          <div className={s.nilaiRow}>
            <span className={s.nilai}>{fmtTon(data?.totalTon ?? 0)}</span>
            <span className={s.satuan}>Ton</span>
          </div>
        )}
        {data && !galat && (
          <span className={s.catatan}>dari {fmtTon(data.jumlahInvestor)} investor</span>
        )}
        <button type="button" className={s.tombol} onClick={muat} disabled={memuat}>
          {memuat ? "Memuat…" : "Muat ulang"}
        </button>
      </div>
    </section>
  );
}
