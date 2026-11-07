"use client";

import { useMemo, useState } from "react";
import styles from "./Index.module.css";

const IPO_PRICE = 1000;
const TOTAL_SHARES = 1000000;
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
const periods = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
const presets = [0.1, 1, 10, 100];

function makeCandles(period) {
  const scale = period === "1H" ? 1.2 : period === "1D" ? 2.1 : period === "1W" ? 3.5 : period === "1M" ? 5 : period === "1Y" ? 8 : 11;
  let previous = IPO_PRICE * 0.985;
  return Array.from({ length: 56 }, (_, index) => {
    const drift = Math.sin(index * 0.31) * scale + Math.cos(index * 0.13) * scale * 0.7 + (index / 56) * scale * 1.8;
    const open = previous;
    const close = IPO_PRICE + drift + Math.sin(index * 0.83) * scale * 0.55;
    const high = Math.max(open, close) + 1.5 + Math.abs(Math.sin(index * 1.7)) * scale;
    const low = Math.min(open, close) - 1.5 - Math.abs(Math.cos(index * 1.2)) * scale;
    previous = close;
    return { open, close, high, low };
  });
}

export default function Index() {
  const [mode, setMode] = useState("demo");
  const [period, setPeriod] = useState("1D");
  const [balance, setBalance] = useState(10000);
  const [depositInput, setDepositInput] = useState("10000");
  const [buyInput, setBuyInput] = useState("1");
  const [sellInput, setSellInput] = useState("1");
  const [owned, setOwned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [notice, setNotice] = useState("");

  const candles = useMemo(() => makeCandles(period), [period]);
  const currentPrice = candles[candles.length - 1].close;
  const firstPrice = candles[0].open;
  const change = ((currentPrice - firstPrice) / firstPrice) * 100;
  const minPrice = Math.min(...candles.map((c) => c.low)) - 3;
  const maxPrice = Math.max(...candles.map((c) => c.high)) + 3;
  const x = (i) => 14 + (i * 672) / (candles.length - 1);
  const y = (price) => 178 - ((price - minPrice) / (maxPrice - minPrice)) * 150;
  const available = Math.max(0, TOTAL_SHARES - owned);
  const ownership = (owned / TOTAL_SHARES) * 100;
  const buyQty = Math.max(0, Number(buyInput) || 0);
  const sellQty = Math.max(0, Number(sellInput) || 0);
  const buyTotal = buyQty * currentPrice;
  const sellTotal = sellQty * currentPrice;

  function setQuantity(setter, quantity) {
    setter(String(quantity));
  }

  function addDemoFunds() {
    const amount = Number(depositInput);
    if (!Number.isFinite(amount) || amount <= 0) return setNotice("Masukkan nominal saldo demo yang valid.");
    setBalance((value) => value + amount);
    setNotice("Saldo demo ditambahkan. Tidak ada uang sungguhan yang diproses.");
  }

  function buyShares() {
    if (mode !== "demo") return setNotice("Mode Ril belum tersedia. Hubungkan backend dan mitra broker terlebih dahulu.");
    if (!buyQty || buyQty % 0.1 !== 0) return setNotice("Jumlah pembelian minimal 0,1 lembar dan kelipatannya.");
    if (buyQty > available) return setNotice("Jumlah saham melebihi sisa saham IPO.");
    if (buyTotal > balance) return setNotice("Saldo demo tidak mencukupi.");
    setBalance((value) => value - buyTotal);
    setOwned((value) => value + buyQty);
    setTransactions((value) => [{ id: Date.now(), type: "BUY", qty: buyQty, price: currentPrice, total: buyTotal, time: new Date().toLocaleString("id-ID") }, ...value]);
    setNotice("Pembelian CSCID berhasil dalam simulasi Demo.");
  }

  function sellShares() {
    if (mode !== "demo") return setNotice("Mode Ril belum tersedia. Hubungkan backend dan mitra broker terlebih dahulu.");
    if (!sellQty || sellQty % 0.1 !== 0) return setNotice("Jumlah penjualan minimal 0,1 lembar dan kelipatannya.");
    if (sellQty > owned) return setNotice("Jumlah jual melebihi saham yang kamu miliki.");
    setOwned((value) => Math.max(0, value - sellQty));
    setBalance((value) => value + sellTotal);
    setTransactions((value) => [{ id: Date.now(), type: "SELL", qty: sellQty, price: currentPrice, total: sellTotal, time: new Date().toLocaleString("id-ID") }, ...value]);
    setNotice("Penjualan CSCID berhasil dalam simulasi Demo.");
  }

  return (
    <section className={styles.section} id="index-cscid">
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>CSCID EXCHANGE · IPO MARKET</span>
            <h2>Index CSCID</h2>
            <p>Pasar saham Coconut Shell Charcoal Indonesia</p>
          </div>
          <div className={styles.modeSwitch} aria-label="Pilih mode perdagangan">
            <button type="button" className={mode === "demo" ? styles.modeActive : ""} onClick={() => { setMode("demo"); setNotice("Mode Demo aktif. Transaksi menggunakan saldo simulasi."); }}>DEMO</button>
            <button type="button" className={mode === "real" ? styles.modeActive : ""} onClick={() => { setMode("real"); setNotice("Mode Ril dipilih, tetapi transaksi uang sungguhan belum diaktifkan."); }}>RIL <span className={styles.lock}>●</span></button>
          </div>
        </div>

        <div className={styles.quote}>
          <div className={styles.quoteIdentity}>
            <span className={styles.symbol}>CSCID</span>
            <span className={styles.exchange}>CSCID · COMMON STOCK</span>
            <span className={styles.ipoBadge}>IPO OPEN</span>
          </div>
          <div className={styles.quotePrice}>
            <strong>{money(currentPrice)}</strong>
            <span className={change >= 0 ? styles.positive : styles.negative}>{change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% <small>simulasi</small></span>
          </div>
        </div>

        <div className={styles.chartTop}>
          <div><span>PRICE CHART</span><small>Pergerakan ilustratif saham CSCID</small></div>
          <div className={styles.periods}>{periods.map((item) => <button type="button" key={item} onClick={() => setPeriod(item)} className={period === item ? styles.periodActive : ""}>{item}</button>)}</div>
        </div>
        <div className={styles.chartWrap}>
          <svg className={styles.chart} viewBox="0 0 740 205" role="img" aria-label="Grafik candlestick simulasi harga saham CSCID">
            {[28, 66, 104, 142, 180].map((line) => <g key={line}><line x1="8" x2="690" y1={line} y2={line} className={styles.gridLine} /><text x="700" y={line + 4} className={styles.axisText}>{(maxPrice - ((line - 28) / 152) * (maxPrice - minPrice)).toFixed(0)}</text></g>)}
            {candles.map((c, i) => {
              const up = c.close >= c.open;
              const top = y(Math.max(c.open, c.close));
              const bottom = y(Math.min(c.open, c.close));
              return <g key={i} className={up ? styles.candleUp : styles.candleDown}>
                <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke="currentColor" strokeWidth="1.2" />
                <rect x={x(i) - 3.1} y={top} width="6.2" height={Math.max(2, bottom - top)} rx="1" fill="currentColor" />
              </g>;
            })}
            <line x1="8" x2="690" y1={y(currentPrice)} y2={y(currentPrice)} className={styles.priceLine} strokeDasharray="4 4" />
            <circle cx={x(candles.length - 1)} cy={y(currentPrice)} r="3.5" className={styles.priceDot} />
            <text x="14" y="199" className={styles.axisText}>{period === "1H" ? "60 MIN" : period === "1D" ? "TODAY" : period}</text>
            <text x="650" y="199" className={styles.axisText}>NOW</text>
          </svg>
        </div>

        <div className={styles.marketStats}>
          <div><span>HARGA IPO</span><strong>{money(IPO_PRICE)}</strong></div>
          <div><span>HARGA TERAKHIR</span><strong>{money(currentPrice)}</strong></div>
          <div><span>SAHAM TERSEDIA</span><strong>{number(available)}</strong></div>
          <div><span>KEPEMILIKAN DEMO</span><strong>{number(ownership)}%</strong></div>
        </div>

        <div className={styles.ipoProgress}>
          <div className={styles.progressHeading}><span>PROGRES IPO</span><strong>{ownership.toFixed(4)}% teralokasi</strong></div>
          <div className={styles.progress}><span style={{ width: ownership + "%" }} /></div>
          <div className={styles.progressLabels}><span>Terjual {number(owned)} lembar</span><span>Tersedia {number(available)} lembar</span></div>
        </div>

        <div className={styles.tradeLayout}>
          <div className={styles.orderPanel}>
            <div className={styles.panelHeading}><span className={styles.buyLabel}>BUY / BELI</span><span>CSCID</span></div>
            <label htmlFor="cscid-buy-qty">Jumlah saham</label>
            <div className={styles.qtyPresets}>{presets.map((qty) => <button key={qty} type="button" className={Number(buyInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setBuyInput, qty)}>{String(qty).replace(".", ",")}</button>)}</div>
            <input id="cscid-buy-qty" type="number" min="0.1" step="0.1" value={buyInput} onChange={(e) => setBuyInput(e.target.value)} />
            <div className={styles.orderTotal}><span>Estimasi total</span><strong>{money(buyTotal)}</strong></div>
            <button type="button" className={styles.buyButton} onClick={buyShares}>Beli CSCID</button>
          </div>
          <div className={styles.orderPanel}>
            <div className={styles.panelHeading}><span className={styles.sellLabel}>SELL / JUAL</span><span>CSCID</span></div>
            <label htmlFor="cscid-sell-qty">Jumlah saham</label>
            <div className={styles.qtyPresets}>{presets.map((qty) => <button key={qty} type="button" className={Number(sellInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setSellInput, qty)}>{String(qty).replace(".", ",")}</button>)}</div>
            <input id="cscid-sell-qty" type="number" min="0.1" step="0.1" max={owned} value={sellInput} onChange={(e) => setSellInput(e.target.value)} />
            <div className={styles.orderTotal}><span>Estimasi hasil jual</span><strong>{money(sellTotal)}</strong></div>
            <button type="button" className={styles.sellButton} onClick={sellShares}>Jual CSCID</button>
          </div>
        </div>

        <div className={styles.accountGrid}>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>AKUN {mode === "demo" ? "DEMO" : "RIL"}</span>
            <strong>{mode === "demo" ? money(balance) : "Belum terhubung"}</strong>
            <small>{mode === "demo" ? "Saldo simulasi tersedia" : "Perlu verifikasi dan integrasi broker"}</small>
            {mode === "demo" && <div className={styles.deposit}><input aria-label="Nominal tambah saldo demo" type="number" min="1" value={depositInput} onChange={(e) => setDepositInput(e.target.value)} /><button type="button" onClick={addDemoFunds}>Tambah saldo demo</button></div>}
          </div>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>PORTOFOLIO CSCID</span>
            <strong>{number(owned)} lembar</strong>
            <small>Nilai indikatif {money(owned * currentPrice)}</small>
          </div>
        </div>

        {notice && <p className={styles.notice} role="status">{notice}</p>}

        <div className={styles.history}>
          <div className={styles.historyTitle}><h3>Riwayat order</h3><span>{transactions.length} transaksi</span></div>
          {transactions.length === 0 ? <p className={styles.empty}>Belum ada aktivitas. Transaksi Demo akan muncul di sini.</p> : transactions.slice(0, 8).map((item) => (
            <div className={styles.historyRow} key={item.id}>
              <span className={item.type === "BUY" ? styles.buyLabel : styles.sellLabel}>{item.type}</span>
              <span>{number(item.qty)} CSCID</span>
              <strong>{money(item.total)}</strong>
              <small>@ {money(item.price)} · {item.time}</small>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>GRAFIK DAN HARGA DI HALAMAN INI BERSIFAT SIMULASI, BUKAN KUTIPAN PASAR LANGSUNG. Mode Demo hanya berjalan di sesi browser ini. Mode Ril belum aktif dan tidak menerima atau memproses dana sungguhan. Aktivasi perdagangan riil memerlukan badan usaha dan pencatatan kepemilikan yang sah, backend aman, serta mitra broker/perizinan yang sesuai.</p>
      </div>
    </section>
  );
}
