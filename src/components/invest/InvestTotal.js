"use client";

import React, { useCallback, useEffect, useState } from "react";
import s from "./InvestTotal.module.css";

const fmtTon = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

// Ringkasan "Total Keseluruhan Stock Investor" di dalam panel Invest CSCID (bukan kartu terpisah).
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
    <div className={s.band} aria-live="polite">
      <div className={s.isi}>
        <span className={s.label}>Total Keseluruhan Stock Investor</span>
        {galat ? (
          <span className={s.galat} role="alert">{galat}</span>
        ) : memuat && !data ? (
          <span className={s.muat}>Memuat…</span>
        ) : (
          <div className={s.nilaiRow}>
            <span className={s.nilai}>{fmtTon(data?.totalTon ?? 0)}</span>
            <span className={s.satuan}>Ton</span>
            {data && <span className={s.ket}>dari {fmtTon(data.jumlahInvestor)} investor</span>}
          </div>
        )}
      </div>
      <button type="button" className={s.muatUlang} onClick={muat} disabled={memuat} aria-label="Muat ulang total stock investor">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={memuat ? s.putar : undefined}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
        </svg>
        <span>{memuat ? "Memuat" : "Muat ulang"}</span>
      </button>
    </div>
  );
}
