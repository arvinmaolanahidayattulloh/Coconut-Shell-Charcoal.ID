"use client";

import { useMemo, useState } from "react";
import styles from "./Index.module.css";

const IPO_PRICE = 1000;
const TOTAL_SHARES = 1000000;
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value) => new Intl.NumberFormat("id-ID").format(value);

export default function Index() {
  const [balance, setBalance] = useState(0);
  const [depositInput, setDepositInput] = useState("10000");
  const [buyInput, setBuyInput] = useState("1");
  const [sellInput, setSellInput] = useState("1");
  const [owned, setOwned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [notice, setNotice] = useState("");

  const sold = owned;
  const available = TOTAL_SHARES - sold;
  const ownership = (sold / TOTAL_SHARES) * 100;
  const buyQty = Math.max(0, Math.floor(Number(buyInput) || 0));
  const sellQty = Math.max(0, Math.floor(Number(sellInput) || 0));
  const buyTotal = buyQty * IPO_PRICE;
  const sellTotal = sellQty * IPO_PRICE;

  const history = useMemo(() => transactions.slice(0, 6), [transactions]);

  function addDemoFunds() {
    const amount = Number(depositInput);
    if (!Number.isFinite(amount) || amount <= 0) return setNotice("Masukkan nominal saldo demo yang valid.");
    setBalance((current) => current + amount);
    setNotice("Saldo demo berhasil ditambahkan. Tidak ada pembayaran sungguhan.");
  }

  function buyShares() {
    if (!buyQty) return setNotice("Masukkan jumlah saham yang valid.");
    if (buyQty > available) return setNotice("Jumlah saham melebihi sisa IPO.");
    if (buyTotal > balance) return setNotice("Saldo demo tidak mencukupi.");
    setBalance((current) => current - buyTotal);
    setOwned((current) => current + buyQty);
    setTransactions((current) => [{ id: Date.now(), type: "BUY", qty: buyQty, total: buyTotal, time: new Date().toLocaleString("id-ID") }, ...current]);
    setNotice("Simulasi pembelian CSCID berhasil.");
  }

  function sellShares() {
    if (!sellQty) return setNotice("Masukkan jumlah saham yang valid.");
    if (sellQty > owned) return setNotice("Jumlah jual melebihi saham yang kamu miliki.");
    setOwned((current) => current - sellQty);
    setBalance((current) => current + sellTotal);
    setTransactions((current) => [{ id: Date.now(), type: "SELL", qty: sellQty, total: sellTotal, time: new Date().toLocaleString("id-ID") }, ...current]);
    setNotice("Simulasi penjualan CSCID berhasil.");
  }

  return (
    <section className={styles.section} id="index-cscid">
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>IPO • STOCK MARKET</span>
            <h2>Index CSCID</h2>
            <p>Pasar saham internal Coconut Shell Charcoal Indonesia</p>
          </div>
          <span className={styles.status}><i /> IPO OPEN</span>
        </div>

        <div className={styles.stock}>
          <div>
            <span className={styles.muted}>TICKER</span>
            <strong className={styles.ticker}>CSCID</strong>
            <span className={styles.muted}>Common shares</span>
          </div>
          <div className={styles.price}>
            <span className={styles.muted}>HARGA IPO / LEMBAR</span>
            <strong>{money(IPO_PRICE)}</strong>
          </div>
        </div>

        <div className={styles.metrics}>
          <div><span>Total saham</span><strong>{number(TOTAL_SHARES)}</strong></div>
          <div><span>Terjual</span><strong>{number(sold)} ({ownership.toFixed(4)}%)</strong></div>
          <div><span>Tersedia</span><strong>{number(available)} ({(100 - ownership).toFixed(4)}%)</strong></div>
        </div>
        <div className={styles.progress}><span style={{ width: `${ownership}%` }} /></div>
        <div className={styles.progressLabels}><span>0% terjual</span><span>100% tersedia saat IPO</span></div>

        <div className={styles.wallet}>
          <div><span className={styles.muted}>SALDO DEMO</span><strong>{money(balance)}</strong></div>
          <div className={styles.deposit}>
            <input aria-label="Nominal tambah saldo demo" type="number" min="1" value={depositInput} onChange={(e) => setDepositInput(e.target.value)} />
            <button type="button" onClick={addDemoFunds}>Tambah saldo demo</button>
          </div>
        </div>

        <div className={styles.tradeGrid}>
          <div className={styles.tradePanel}>
            <span className={styles.buyTag}>BUY CSCID</span>
            <label htmlFor="index-buy-qty">Jumlah lembar</label>
            <input id="index-buy-qty" type="number" min="1" step="1" value={buyInput} onChange={(e) => setBuyInput(e.target.value)} />
            <div className={styles.total}><span>Total pembelian</span><strong>{money(buyTotal)}</strong></div>
            <button type="button" className={styles.buyButton} onClick={buyShares}>Beli saham</button>
          </div>
          <div className={styles.tradePanel}>
            <span className={styles.sellTag}>SELL CSCID</span>
            <label htmlFor="index-sell-qty">Jumlah lembar</label>
            <input id="index-sell-qty" type="number" min="1" max={owned} step="1" value={sellInput} onChange={(e) => setSellInput(e.target.value)} />
            <div className={styles.total}><span>Estimasi hasil jual</span><strong>{money(sellTotal)}</strong></div>
            <button type="button" className={styles.sellButton} onClick={sellShares}>Jual saham</button>
          </div>
        </div>

        <div className={styles.portfolio}>
          <div><span className={styles.muted}>PORTOFOLIO CSCID</span><strong>{number(owned)} lembar</strong></div>
          <div><span className={styles.muted}>NILAI PADA HARGA IPO</span><strong>{money(owned * IPO_PRICE)}</strong></div>
        </div>

        {notice && <p className={styles.notice} role="status">{notice}</p>}

        <div className={styles.history}>
          <h3>Aktivitas transaksi</h3>
          {history.length === 0 ? <p className={styles.empty}>Belum ada transaksi saham.</p> : history.map((item) => (
            <div className={styles.historyRow} key={item.id}>
              <span className={item.type === "BUY" ? styles.buyText : styles.sellText}>{item.type}</span>
              <span>{number(item.qty)} CSCID</span>
              <strong>{money(item.total)}</strong>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
        <p className={styles.disclaimer}>MODE SIMULASI — saldo dan transaksi hanya tersimpan selama halaman ini terbuka. Ini bukan penawaran efek resmi, bukan rekening dana, dan tidak terhubung ke bursa atau broker.</p>
      </div>
    </section>
  );
}
