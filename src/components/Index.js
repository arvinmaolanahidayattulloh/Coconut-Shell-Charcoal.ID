"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./Index.module.css";
import DemoAuth from "./DemoAuth";
import ExchangeChart from "./ExchangeChart";

const SHARES_PER_LOT = 100;
const EXCHANGE_MODE = process.env.NEXT_PUBLIC_CSCID_EXCHANGE_ENV === "real" ? "real" : "demo";
const CURRENCIES = [
  { code: "IDR", label: "IDR · Rupiah" },
  { code: "USD", label: "USD · US Dollar" },
  { code: "EUR", label: "EUR · Euro" },
  { code: "GBP", label: "GBP · Pound Sterling" },
  { code: "JPY", label: "JPY · Yen" },
  { code: "SGD", label: "SGD · Singapore Dollar" },
  { code: "MYR", label: "MYR · Ringgit" },
  { code: "AUD", label: "AUD · Australian Dollar" },
  { code: "CNY", label: "CNY · Yuan" },
  { code: "SAR", label: "SAR · Riyal" },
];
const QUANTITY_PRESETS = [0.01, 0.1, 1, 10];

const number = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(Number(value) || 0);

export default function Index() {
  const [mode, setMode] = useState(EXCHANGE_MODE);
  const [currency, setCurrency] = useState("IDR");
  const [fxRates, setFxRates] = useState(null);
  const [fxUpdatedAt, setFxUpdatedAt] = useState(null);
  const [period, setPeriod] = useState("1D");
  const [balance, setBalance] = useState(0);
  const [buyInput, setBuyInput] = useState("0.01");
  const [sellInput, setSellInput] = useState("0.01");
  const [buyPriceInput, setBuyPriceInput] = useState("");
  const [sellPriceInput, setSellPriceInput] = useState("");
  const [owned, setOwned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [marketError, setMarketError] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState(null);

  const handleAuth = useCallback((user) => {
    setAccount(user);
    if (user) {
      setBalance(user.balance);
      setOwned(user.shares);
      setTransactions([]);
    } else {
      setBalance(0);
      setOwned(0);
      setTransactions([]);
      setMarketData(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.rates) throw new Error("Kurs mata uang belum tersedia.");
        if (!active) return;
        setFxRates(data.rates);
        setFxUpdatedAt(data.timestamp || Date.now());
      } catch {
        if (active) setFxRates((previous) => previous || { USD: 1 });
      }
    };
    loadRates();
    const timer = setInterval(loadRates, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!account) {
      setMarketData(null);
      return;
    }
    let active = true;
    const loadMarket = async () => {
      try {
        const response = await fetch("/api/exchange/market", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Data pasar belum dapat dimuat.");
        if (!active) return;
        setMarketData(data);
        setBalance(data.account.balanceCents / 100);
        setOwned(data.account.shares);
        setTransactions((data.trades || []).map((trade) => ({
          id: trade.id,
          type: trade.buyer === data.account.username ? "BUY" : trade.seller === data.account.username ? "SELL" : "TRADE",
          qty: trade.quantity,
          price: trade.priceCents / 100,
          total: trade.quantity * trade.priceCents / 100,
          time: new Date(trade.createdAt).toLocaleString("id-ID"),
        })));
        setMarketError("");
      } catch (error) {
        if (active) setMarketError(error.message || "Gagal memuat pasar.");
      }
    };
    loadMarket();
    const timer = setInterval(loadMarket, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [account]);

  const rate = currency === "USD" ? 1 : Number(fxRates?.[currency]) || 0;
  const decimals = currency === "IDR" || currency === "JPY" ? 0 : 2;
  const formatMoney = (usdValue) => {
    if (usdValue == null || !Number.isFinite(Number(usdValue))) return "—";
    if (rate <= 0) return "Memuat kurs...";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(usdValue) * rate);
  };
  const toUsd = (displayValue) => {
    const amount = Number(displayValue);
    return Number.isFinite(amount) && rate > 0 ? amount / rate : 0;
  };
  const fromUsd = (usdValue) => rate > 0 ? Number((Number(usdValue || 0) * rate).toFixed(decimals)) : "";
  const recentTrades = marketData?.trades || [];
  const currentPrice = marketData?.market?.lastPriceCents > 0
    ? marketData.market.lastPriceCents / 100
    : recentTrades[0]?.priceCents > 0 ? recentTrades[0].priceCents / 100 : null;
  const previousPrice = recentTrades.length > 1 ? recentTrades[1].priceCents / 100 : null;
  const change = currentPrice && previousPrice
    ? ((currentPrice - previousPrice) / previousPrice) * 100
    : null;
  const live = Boolean(account && marketData && !marketError);
  const liveLabel = !account ? "LOGIN DIPERLUKAN" : marketError ? "GANGGUAN" : marketData ? "LIVE" : "MENGHUBUNGKAN";
  const ownedShares = Number(owned) || 0;
  const ownedLots = ownedShares / SHARES_PER_LOT;
  const lockedShares = Number(marketData?.account?.lockedShares) || 0;
  const bestBid = marketData?.bids?.[0]?.priceCents ? marketData.bids[0].priceCents / 100 : null;
  const bestAsk = marketData?.asks?.[0]?.priceCents ? marketData.asks[0].priceCents / 100 : null;
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
  const maxDepth = Math.max(
    1,
    ...(marketData?.bids || []).map((item) => item.quantity),
    ...(marketData?.asks || []).map((item) => item.quantity),
  );
  const referencePrice = currentPrice || bestAsk || bestBid || 0.01;
  const buyPrice = Number(buyPriceInput) > 0 ? Number(buyPriceInput) : referencePrice;
  const sellPrice = Number(sellPriceInput) > 0 ? Number(sellPriceInput) : referencePrice;
  const buyLots = Math.max(0, Number(buyInput) || 0);
  const sellLots = Math.max(0, Number(sellInput) || 0);
  const buyQty = Math.round(buyLots * SHARES_PER_LOT);
  const sellQty = Math.round(sellLots * SHARES_PER_LOT);
  const buyTotal = buyQty * buyPrice;
  const sellTotal = sellQty * sellPrice;
  const unlimitedBuying = Boolean(account?.isUnlimitedBuyer || marketData?.account?.isUnlimitedBuyer);
  const maxBuyLots = unlimitedBuying
    ? Math.floor(((marketData?.market?.buyLiquidityShares || 0) / SHARES_PER_LOT) * 100) / 100
    : buyPrice > 0 ? Math.floor((balance / buyPrice / SHARES_PER_LOT) * 100) / 100 : 0;
  const maxSellLots = Math.floor((Math.max(0, ownedShares - lockedShares) / SHARES_PER_LOT) * 100) / 100;
  const totalTradedShares = recentTrades.reduce((sum, trade) => sum + (Number(trade.quantity) || 0), 0);

  function adjustPrice(side, direction) {
    const current = side === "BUY" ? buyPrice : sellPrice;
    const next = Math.max(0.01, Math.round((current + direction * 0.01 + Number.EPSILON) * 100) / 100);
    if (side === "BUY") setBuyPriceInput(String(next));
    else setSellPriceInput(String(next));
  }

  function choosePrice(side, displayValue) {
    const next = toUsd(displayValue);
    if (!Number.isFinite(next) || next <= 0) {
      if (side === "BUY") setBuyPriceInput("");
      else setSellPriceInput("");
      return;
    }
    if (side === "BUY") setBuyPriceInput(String(next));
    else setSellPriceInput(String(next));
  }

  function setQuantity(setter, quantity) {
    setter(String(Math.max(0, quantity)));
  }

  async function submitOrder(side) {
    if (!account) {
      setNotice("Silakan masuk ke akun untuk memasang order.");
      return;
    }
    if (orderBusy) return;
    const lots = side === "BUY" ? buyLots : sellLots;
    const price = side === "BUY" ? buyPrice : sellPrice;
    const quantity = side === "BUY" ? buyQty : sellQty;
    if (!lots || Math.abs(lots * 100 - Math.round(lots * 100)) > 0.000001 || quantity < 1) {
      setNotice("Jumlah minimum adalah 0,01 lot (1 lembar saham).");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setNotice("Masukkan harga limit yang valid.");
      return;
    }
    setOrderBusy(true);
    try {
      const response = await fetch("/api/exchange/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, price, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order tidak dapat diproses.");
      setNotice(`Order ${side === "BUY" ? "beli" : "jual"} berhasil masuk ke antrean. Status: ${data.status}. Sisa: ${number(data.remaining, 0)} lembar.`);
      const refreshed = await fetch("/api/exchange/market", { cache: "no-store" });
      const market = await refreshed.json();
      if (refreshed.ok) {
        setMarketData(market);
        setBalance(market.account.balanceCents / 100);
        setOwned(market.account.shares);
      }
    } catch (error) {
      setNotice(error.message || "Order gagal diproses.");
    } finally {
      setOrderBusy(false);
    }
  }

  async function cancelOrder(id) {
    try {
      const response = await fetch(`/api/exchange/market?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pembatalan order gagal.");
      setNotice("Order berhasil dibatalkan. Saldo dan saham yang sebelumnya dikunci telah dilepaskan.");
      const refreshed = await fetch("/api/exchange/market", { cache: "no-store" });
      const market = await refreshed.json();
      if (refreshed.ok) {
        setMarketData(market);
        setBalance(market.account.balanceCents / 100);
        setOwned(market.account.shares);
      }
    } catch (error) {
      setNotice(error.message || "Order tidak dapat dibatalkan.");
    }
  }

  const periodOptions = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
  const activeOrders = (marketData?.orders || []).filter((order) => ["OPEN", "PARTIAL"].includes(order.status));

  return (
    <section className={styles.section} id="index-cscid">
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.eyebrow}>Index CSCID</span>
            <span className={styles.subtitle}>Coconut Shell Charcoal Indonesia · Pasar Saham</span>
          </div>
          <div className={styles.headerRight}>
            <div className={`${styles.liveIndicator} ${live ? styles.liveIndicatorOn : ""}`}>
              <span className={`${styles.liveDot} ${live ? styles.liveDotActive : ""}`} />
              <span className={`${styles.liveText} ${live ? styles.liveTextOn : ""}`}>{liveLabel}</span>
            </div>
            <div className={styles.modeSwitch} aria-label="Lingkungan server">
              <button type="button" className={mode === "demo" ? styles.modeActive : ""} onClick={() => {
                const url = process.env.NEXT_PUBLIC_CSCID_DEMO_URL;
                if (url) window.location.assign(url);
                else if (EXCHANGE_MODE === "demo") setNotice("Server Demo sedang aktif.");
                else setNotice("Alamat server Demo belum dikonfigurasi.");
              }}>DEMO</button>
              <button type="button" className={mode === "real" ? styles.modeActive : ""} onClick={() => {
                const url = process.env.NEXT_PUBLIC_CSCID_REAL_URL;
                if (url) window.location.assign(url);
                else if (EXCHANGE_MODE === "real") setNotice("Server Real sedang aktif. Seluruh order dicatat pada database aplikasi.");
                else setNotice("Server Real belum dikonfigurasi pada deployment ini.");
              }}>REAL</button>
            </div>
          </div>
        </div>

        <p className={styles.marketIntro}>
          Perdagangan sekunder saham CSCID. Kepemilikan saham tercatat pada database akun masing-masing pemegang saham.
          Setiap pemegang saham bebas mempertahankan kepemilikannya atau mengajukan order jual atas saham yang dimiliki.
        </p>

        <DemoAuth onAuth={handleAuth} />

        <div className={`notranslate ${styles.priceMain}`} translate="no">
          <div className={styles.priceQuote}>
            <span className={styles.statLabel}>HARGA TRANSAKSI TERAKHIR</span>
            <div className={styles.bigPrice}>
              {formatMoney(currentPrice)}
              <span className={styles.bigPriceUnit}> / LEMBAR</span>
            </div>
            <small className={styles.priceNote}>
              {currentPrice == null ? "Belum ada transaksi yang matched." : "Harga berdasarkan transaksi saham CSCID yang telah matched."}
            </small>
          </div>
          <div className={styles.priceStats}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>PERUBAHAN TERAKHIR</span>
              <span className={`${styles.statVal} ${change == null ? "" : change >= 0 ? styles.up : styles.down}`}>
                {change == null ? "—" : `${change >= 0 ? "▲ +" : "▼ "}${change.toFixed(2)}%`}
              </span>
              <small className={styles.priceNote}>Dibanding transaksi sebelumnya</small>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>SIMBOL</span>
              <span className={styles.statVal}>CSCID</span>
              <small className={styles.priceNote}>COMMON STOCK</small>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>SERVER</span>
              <span className={styles.statVal}>{mode.toUpperCase()}</span>
              <small className={styles.priceNote}>PASAR SEKUNDER</small>
            </div>
          </div>
        </div>

        <div className={styles.currencyBar}>
          <label htmlFor="cscid-currency">MATA UANG TAMPILAN</label>
          <select id="cscid-currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
          <small>
            Konversi mengikuti kurs dari layanan PriceChart
            {fxUpdatedAt ? ` · diperbarui ${new Date(fxUpdatedAt).toLocaleTimeString("id-ID")}` : " · menunggu data kurs"}.
            Denominasi pencatatan order tetap USD.
          </small>
        </div>

        <div className={styles.chartTop}>
          <div><span>PRICE CHART · CSCID</span><small>Grafik menampilkan riwayat transaksi saham yang benar-benar matched.</small></div>
          <div className={styles.periods}>
            {periodOptions.map((item) => (
              <button type="button" key={item} onClick={() => setPeriod(item)} className={period === item ? styles.periodActive : ""}>{item}</button>
            ))}
          </div>
        </div>
        <div className={styles.chartWrap}>
          <ExchangeChart trades={recentTrades} period={period} />
        </div>

        <div className={styles.marketStats}>
          <div><span>BID TERTINGGI</span><strong>{formatMoney(bestBid)}</strong></div>
          <div><span>ASK TERENDAH</span><strong>{formatMoney(bestAsk)}</strong></div>
          <div><span>SPREAD TENGAH</span><strong>{formatMoney(midPrice)}</strong></div>
          <div><span>VOLUME RIWAYAT</span><strong>{number(totalTradedShares, 0)} lembar</strong></div>
        </div>

        <div className={styles.tradeLayout}>
          <div className={styles.orderPanel}>
            <div className={styles.panelHeading}>
              <span>TRANSAKSI SAHAM CSCID</span>
              <span>1 LOT = 100 LEMBAR</span>
            </div>
            <div className={styles.tradeColumns}>
              <div className={`${styles.tradeSide} ${styles.sellSide}`}>
                <div className={styles.sideHeading}>
                  <strong>SELL · JUAL</strong>
                  <small>Pasang penawaran jual saham</small>
                </div>
                <label htmlFor="cscid-sell-price">Harga jual per lembar ({currency})</label>
                <div className={styles.priceControl}>
                  <button type="button" aria-label="Kurangi harga jual" onClick={() => adjustPrice("SELL", -1)}>−</button>
                  <input id="cscid-sell-price" type="number" min="0.01" step="0.01" value={fromUsd(sellPrice)} onChange={(event) => choosePrice("SELL", event.target.value)} />
                  <button type="button" aria-label="Tambah harga jual" onClick={() => adjustPrice("SELL", 1)}>+</button>
                </div>
                <label htmlFor="cscid-sell-qty">Jumlah lot yang dijual</label>
                <div className={styles.qtyPresets}>
                  {QUANTITY_PRESETS.map((qty) => <button key={qty} type="button" className={Number(sellInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setSellInput, qty)}>{String(qty).replace(".", ",")}</button>)}
                  <button type="button" onClick={() => setQuantity(setSellInput, maxSellLots)}>MAX</button>
                </div>
                <input id="cscid-sell-qty" type="number" min="0.01" step="0.01" max={ownedLots} value={sellInput} onChange={(event) => setSellInput(event.target.value)} />
                <div className={styles.orderTotal}><span>Estimasi hasil jual</span><strong>{formatMoney(sellTotal)}</strong></div>
                <small className={styles.orderHint}>Saham tersedia: {number(Math.max(0, ownedShares - lockedShares), 0)} lembar.</small>
                <button type="button" className={styles.sellButton} onClick={() => submitOrder("SELL")} disabled={orderBusy}>
                  {orderBusy ? "Memproses..." : "SELL · JUAL CSCID"}
                </button>
              </div>

              <div className={`${styles.tradeSide} ${styles.buySide}`}>
                <div className={styles.sideHeading}>
                  <strong>BUY · BELI</strong>
                  <small>Ajukan permintaan pembelian saham</small>
                </div>
                <label htmlFor="cscid-buy-price">Harga beli per lembar ({currency})</label>
                <div className={styles.priceControl}>
                  <button type="button" aria-label="Kurangi harga beli" onClick={() => adjustPrice("BUY", -1)}>−</button>
                  <input id="cscid-buy-price" type="number" min="0.01" step="0.01" value={fromUsd(buyPrice)} onChange={(event) => choosePrice("BUY", event.target.value)} />
                  <button type="button" aria-label="Tambah harga beli" onClick={() => adjustPrice("BUY", 1)}>+</button>
                </div>
                <label htmlFor="cscid-buy-qty">Jumlah lot yang dibeli</label>
                <div className={styles.qtyPresets}>
                  {QUANTITY_PRESETS.map((qty) => <button key={qty} type="button" className={Number(buyInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setBuyInput, qty)}>{String(qty).replace(".", ",")}</button>)}
                  <button type="button" onClick={() => setQuantity(setBuyInput, maxBuyLots)}>MAX</button>
                </div>
                <input id="cscid-buy-qty" type="number" min="0.01" step="0.01" value={buyInput} onChange={(event) => setBuyInput(event.target.value)} />
                <div className={styles.orderTotal}><span>Estimasi total beli</span><strong>{formatMoney(buyTotal)}</strong></div>
                <small className={styles.orderHint}>
                  {unlimitedBuying ? "Batas saldo akun tidak diterapkan; order hanya matched bila ada penjual." : `Saldo tersedia: ${formatMoney(balance)}.`}
                </small>
                <button type="button" className={styles.buyButton} onClick={() => submitOrder("BUY")} disabled={orderBusy}>
                  {orderBusy ? "Memproses..." : "BUY · BELI CSCID"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.accountGrid}>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>SALDO TERSEDIA · {mode.toUpperCase()}</span>
            <strong>{unlimitedBuying ? "TIDAK DIBATASI" : account ? formatMoney(balance) : "Login diperlukan"}</strong>
            <small>Saldo yang dapat digunakan untuk order pembelian.</small>
            <small>Saldo yang terkunci pada order beli: {formatMoney((marketData?.account?.lockedBalanceCents || 0) / 100)}.</small>
          </div>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>KEPEMILIKAN SAHAM CSCID</span>
            <strong>{number(ownedLots)} lot / {number(ownedShares, 0)} lembar</strong>
            <small>Nilai indikatif portofolio: {formatMoney(ownedShares * (currentPrice || 0))}.</small>
            <small>Saham yang terkunci pada order jual: {number(lockedShares, 0)} lembar.</small>
          </div>
        </div>

        <p className={styles.shareholderNotice}>
          Kepemilikan saham mengacu pada catatan saham setiap akun di database. Keputusan untuk menjual atau mempertahankan saham sepenuhnya berada pada pemegang saham.
          Sistem tidak menawarkan atau menjual saham secara otomatis atas nama pemegang saham.
        </p>

        {(notice || marketError) && <p className={styles.notice} role="status">{notice || marketError}</p>}

        <div className={styles.marketDepth}>
          <div className={styles.historyTitle}>
            <h3>Order Book · Antrean Harga</h3>
            <span>{midPrice ? `Mid-price ${formatMoney(midPrice)}` : "Harga tengah belum tersedia"} · Pembaruan 4 detik</span>
          </div>
          <div className={styles.depthColumns}>
            <div className={styles.depthColumn}>
              <strong className={styles.buyLabel}>BID · BELI</strong>
              <div className={styles.depthHeader}><span>Harga ({currency})</span><span>Jumlah</span></div>
              {(marketData?.bids || []).length ? marketData.bids.map((item, index) => (
                <div className={styles.depthRow} key={index} style={{ background: `linear-gradient(90deg,rgba(8,153,129,.12) ${Math.min(100, item.quantity / maxDepth * 100)}%,transparent 0)` }}>
                  <strong>{formatMoney(item.priceCents / 100)}</strong><span>{number(item.quantity, 0)}</span>
                </div>
              )) : <p className={styles.empty}>Belum ada antrean beli.</p>}
            </div>
            <div className={styles.depthColumn}>
              <strong className={styles.sellLabel}>ASK · JUAL</strong>
              <div className={styles.depthHeader}><span>Harga ({currency})</span><span>Jumlah</span></div>
              {(marketData?.asks || []).length ? marketData.asks.map((item, index) => (
                <div className={styles.depthRow} key={index} style={{ background: `linear-gradient(270deg,rgba(242,54,69,.12) ${Math.min(100, item.quantity / maxDepth * 100)}%,transparent 0)` }}>
                  <strong>{formatMoney(item.priceCents / 100)}</strong><span>{number(item.quantity, 0)}</span>
                </div>
              )) : <p className={styles.empty}>Belum ada antrean jual.</p>}
            </div>
          </div>
        </div>

        <div className={styles.history}>
          <div className={styles.historyTitle}><h3>Riwayat transaksi</h3><span>{transactions.length} transaksi</span></div>
          {transactions.length === 0 ? <p className={styles.empty}>Belum ada transaksi yang matched.</p> : transactions.slice(0, 10).map((item) => (
            <div className={styles.historyRow} key={item.id}>
              <span className={item.type === "BUY" ? styles.buyLabel : item.type === "SELL" ? styles.sellLabel : ""}>{item.type === "BUY" ? "BELI" : item.type === "SELL" ? "JUAL" : "TRANSAKSI"}</span>
              <span>{number(item.qty, 0)} lembar</span>
              <strong>{formatMoney(item.total)}</strong>
              <small>@ {formatMoney(item.price)} · {item.time}</small>
            </div>
          ))}
        </div>

        <div className={styles.history}>
          <div className={styles.historyTitle}><h3>Order aktif saya</h3><span>{activeOrders.length} antrean</span></div>
          {activeOrders.length === 0 ? <p className={styles.empty}>Tidak ada order aktif.</p> : activeOrders.map((order) => (
            <div className={styles.openOrderRow} key={order.id}>
              <span className={order.side === "BUY" ? styles.buyLabel : styles.sellLabel}>{order.side === "BUY" ? "BELI" : "JUAL"}</span>
              <span>{formatMoney(order.priceCents / 100)} · sisa {number(order.remaining, 0)} lembar</span>
              <strong>{order.status}</strong>
              <button type="button" onClick={() => cancelOrder(order.id)}>Batalkan</button>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Order saham CSCID diproses oleh mesin pencocokan harga dan waktu pada server aplikasi. Saldo serta kepemilikan saham tersimpan pada database;
          aset yang digunakan pada order aktif dikunci sampai order terpenuhi atau dibatalkan. Konversi mata uang hanya mengubah nilai tampilan,
          sedangkan harga order dan penyelesaian internal tetap dicatat dalam USD. Server Real merupakan lingkungan perdagangan internal aplikasi dan
          belum terhubung dengan bank, kustodian, pialang, bursa efek eksternal, atau mekanisme setoran dan penarikan dana.
        </p>
      </div>
    </section>
  );
}
