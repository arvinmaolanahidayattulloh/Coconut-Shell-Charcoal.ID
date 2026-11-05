"use client";
import React, { useCallback, useEffect, useState } from "react";
import s from "./Invest.module.css";

export const TAB_INVEST = { id: "invest", label: "Invest CSCID" };

const fmtTon = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(n);

export default function Invest() {
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
    <section className={s.wrap} aria-labelledby="judul-invest">
      <h2 id="judul-invest" className={s.judul}>Invest CSCID</h2>
      <div className={s.kartu}>
        <span className={s.label}>Total Keseluruhan Stock Investor</span>
        {memuat && !data ? (
          <span className={s.muat}>Memuat…</span>
        ) : galat ? (
          <span className={s.galat} role="alert">{galat}</span>
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
