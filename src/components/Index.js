"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./Index.module.css";
import DemoAuth from "./DemoAuth";
import ExchangeChart from "./ExchangeChart";

const IPO_PRICE = 1000;
const TOTAL_LOTS = 100;
const SHARES_PER_LOT = 100;
const TOTAL_SHARES = TOTAL_LOTS * SHARES_PER_LOT;
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
const periods = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
const presets = [0.1, 1, 10, 100];
const EXCHANGE_MODE = process.env.NEXT_PUBLIC_CSCID_EXCHANGE_ENV === "real" ? "real" : "demo";

export default function Index() {
  const [mode, setMode] = useState(EXCHANGE_MODE);
  const [period, setPeriod] = useState("1D");
  const [balance, setBalance] = useState(0);
  const [buyInput, setBuyInput] = useState("0.1");
  const [sellInput, setSellInput] = useState("0.1");
  const [buyPriceInput, setBuyPriceInput] = useState(String(IPO_PRICE));
  const [sellPriceInput, setSellPriceInput] = useState(String(IPO_PRICE));
  const [owned, setOwned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [marketError, setMarketError] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderSide, setOrderSide] = useState("BUY");
  const [notice, setNotice] = useState("");
  const [demoUser, setDemoUser] = useState(null);
  const handleDemoAuth = useCallback((user) => {
    setDemoUser(user);
    if (user) {
      setBalance(user.balance);
      setOwned(user.shares);
      setTransactions([]);
    } else {
      setBalance(0);
      setOwned(0);
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    if (!demoUser) { setMarketData(null); return; }
    let active = true;
    const loadMarket = async () => {
      try {
        const response = await fetch("/api/exchange/market", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Pasar Demo belum dapat dimuat.");
        if (!active) return;
        setMarketData(data);
        setBalance(data.account.balanceCents / 100);
        setOwned(data.account.shares);
        setTransactions(data.trades.map((trade) => ({
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
    return () => { active = false; clearInterval(timer); };
  }, [demoUser]);

  const currentPrice = marketData?.market?.lastPriceCents ? marketData.market.lastPriceCents / 100 : IPO_PRICE;
  const change = ((currentPrice - IPO_PRICE) / IPO_PRICE) * 100;
  const buyPrice = Math.max(0, Number(buyPriceInput) || 0);
  const sellPrice = Math.max(0, Number(sellPriceInput) || 0);
  const ownedShares = owned;
  const ownedLots = ownedShares / SHARES_PER_LOT;
  const availableShares = marketData?.market?.ipoRemainingShares ?? TOTAL_SHARES;
  const availableLots = availableShares / SHARES_PER_LOT;
  const ipoSoldShares = marketData?.market?.ipoSoldShares ?? 0;
  const ownership = (ipoSoldShares / TOTAL_SHARES) * 100;
  const accountOwnership = (ownedShares / TOTAL_SHARES) * 100;
  const maxBuyLots = demoUser?.isFounder ? Math.floor(((marketData?.market?.buyLiquidityShares || 0) / SHARES_PER_LOT) * 10) / 10 : buyPrice > 0 ? Math.min(TOTAL_LOTS, Math.floor((balance / buyPrice / SHARES_PER_LOT) * 10) / 10) : 0;
  const maxSellLots = Math.min(TOTAL_LOTS, Math.floor(((ownedShares - (marketData?.account?.lockedShares || 0)) / SHARES_PER_LOT) * 10) / 10);
  const bestBid = marketData?.bids?.[0]?.priceCents || null;
  const bestAsk = marketData?.asks?.[0]?.priceCents || null;
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 200 : null;
  const maxDepth = Math.max(1, ...(marketData?.bids || []).map((item) => item.quantity), ...(marketData?.asks || []).map((item) => item.quantity));
  const buyLots = Math.max(0, Number(buyInput) || 0);
  const buyQty = buyLots * SHARES_PER_LOT;
  const sellLots = Math.max(0, Number(sellInput) || 0);
  const sellQty = sellLots * SHARES_PER_LOT;
  const buyTotal = buyQty * buyPrice;
  const sellTotal = sellQty * sellPrice;

  function setQuantity(setter, quantity) {
    setter(String(quantity));
  }

  async function submitOrder(side) {
    if (!demoUser) return setNotice("Silakan login ke akun Demo terlebih dahulu.");
    if (orderBusy) return;
    const lots = side === "BUY" ? buyLots : sellLots;
    const price = side === "BUY" ? buyPrice : sellPrice;
    const quantity = Math.round(lots * SHARES_PER_LOT);
    if (!lots || Math.abs(lots * 10 - Math.round(lots * 10)) > 0.000001) return setNotice("Jumlah minimal 0,1 lot dan kelipatannya.");
    if (!Number.isFinite(price) || price <= 0) return setNotice("Masukkan harga limit yang valid.");
    setOrderBusy(true);
    try {
      const response = await fetch("/api/exchange/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, price, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order gagal dikirim.");
      setNotice(`Order ${side} diterima. Status: ${data.status}. Sisa antrean: ${number(data.remaining)} lembar.`);
      const refreshed = await fetch("/api/exchange/market", { cache: "no-store" });
      const market = await refreshed.json();
      if (refreshed.ok) {
        setMarketData(market);
        setBalance(market.account.balanceCents / 100);
        setOwned(market.account.shares);
      }
    } catch (error) { setNotice(error.message || "Order gagal diproses."); }
    finally { setOrderBusy(false); }
  }

  function buyShares() { return submitOrder("BUY"); }
  function sellShares() { return submitOrder("SELL"); }

  async function cancelOrder(id) {
    try {
      const response = await fetch(`/api/exchange/market?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pembatalan gagal.");
      setNotice("Order berhasil dibatalkan. Saldo/aset yang terkunci telah dilepas.");
      const refreshed = await fetch("/api/exchange/market", { cache: "no-store" });
      const market = await refreshed.json();
      if (refreshed.ok) {
        setMarketData(market);
        setBalance(market.account.balanceCents / 100);
        setOwned(market.account.shares);
      }
    } catch (error) { setNotice(error.message || "Order tidak dapat dibatalkan."); }
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
            <button type="button" className={mode === "demo" ? styles.modeActive : ""} onClick={() => {
              const url = process.env.NEXT_PUBLIC_CSCID_DEMO_URL;
              if (url) window.location.assign(url);
              else if (EXCHANGE_MODE === "demo") { setMode("demo"); setNotice("Anda sudah berada di server Demo."); }
              else setNotice("Alamat server Demo belum dikonfigurasi pada server Real.");
            }}>DEMO</button>
            <button type="button" className={mode === "real" ? styles.modeActive : ""} onClick={() => {
              const url = process.env.NEXT_PUBLIC_CSCID_REAL_URL;
              if (url) window.location.assign(url);
              else if (EXCHANGE_MODE === "real") { setMode("real"); setNotice("Anda sudah berada di server Real."); }
              else setNotice("Server Real memakai deployment dan database terpisah. Server tersebut belum disiapkan untuk transaksi uang sungguhan.");
            }}>REAL <span className={styles.lock}>●</span></button>
          </div>
        </div>

        <DemoAuth onAuth={handleDemoAuth} />

        <div className={styles.quote}>
          <div className={styles.quoteIdentity}>
            <span className={styles.symbol}>CSCID</span>
            <span className={styles.exchange}>CSCID · COMMON STOCK</span>
            <span className={styles.ipoBadge}>FOUNDER SELL ORDER</span>
          </div>
          <div className={styles.quotePrice}>
            <strong>{money(currentPrice)}</strong>
            <span className={change >= 0 ? styles.positive : styles.negative}>{change >= 0 ? "+" : ""}{change.toFixed(2)}% <small>{marketData?.trades?.length ? "berdasarkan transaksi terakhir" : "belum ada transaksi"}</small></span>
          </div>
        </div>

        <div className={styles.chartTop}>
          <div><span>PRICE CHART</span><small>Harga diperbarui dari transaksi yang benar-benar matched di server Demo</small></div>
          <div className={styles.periods}>{periods.map((item) => <button type="button" key={item} onClick={() => setPeriod(item)} className={period === item ? styles.periodActive : ""}>{item}</button>)}</div>
        </div>
        <div className={styles.chartWrap}>
          <ExchangeChart trades={marketData?.trades || []} period={period} />       </div>

        <div className={styles.marketStats}>
          <div><span>HARGA IPO / LEMBAR</span><strong>{money(IPO_PRICE)}</strong></div>
          <div><span>HARGA TERAKHIR</span><strong>{money(currentPrice)}</strong></div>
          <div><span>SAHAM TERSEDIA</span><strong>{number(availableShares)} lembar / {number(availableLots)} lot</strong></div>
          <div><span>KEPEMILIKAN AKUN</span><strong>{number(accountOwnership)}%</strong></div>
        </div>

        <div className={styles.ipoProgress}>
          <div className={styles.progressHeading}><span>PROGRES IPO</span><strong>{ownership.toFixed(4)}% teralokasi</strong></div>
          <div className={styles.progress}><span style={{ width: ownership + "%" }} /></div>
          <div className={styles.progressLabels}><span>IPO terserap {number(ipoSoldShares)} lembar</span><span>Sisa IPO {number(availableShares)} lembar</span></div>
        </div>

        <div className={styles.tradeLayout}>
          <div className={styles.orderPanel}>
            <div className={styles.orderSwitch} role="tablist" aria-label="Jenis transaksi">
              <button type="button" role="tab" aria-selected={orderSide === "BUY"} className={orderSide === "BUY" ? styles.orderSwitchBuyActive : ""} onClick={() => setOrderSide("BUY")}>BUY / BELI</button>
              <button type="button" role="tab" aria-selected={orderSide === "SELL"} className={orderSide === "SELL" ? styles.orderSwitchSellActive : ""} onClick={() => setOrderSide("SELL")}>SELL / JUAL</button>
            </div>
            {orderSide === "BUY" ? <>
              <label htmlFor="cscid-buy-price">Harga beli per lembar (USD)</label>
              <input id="cscid-buy-price" type="number" min="0.01" step="0.01" value={buyPriceInput} onChange={(e) => setBuyPriceInput(e.target.value)} />
              <label htmlFor="cscid-buy-qty">Jumlah lot (1 lot = 100 lembar)</label>
              <div className={styles.qtyPresets}>{presets.map((qty) => <button key={qty} type="button" className={Number(buyInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setBuyInput, qty)}>{String(qty).replace(".", ",")}</button>)}<button type="button" onClick={() => setQuantity(setBuyInput, maxBuyLots)}>MAX</button></div>
              <input id="cscid-buy-qty" type="number" min="0.1" step="0.1" value={buyInput} onChange={(e) => setBuyInput(e.target.value)} />
              <div className={styles.orderTotal}><span>Estimasi total</span><strong>{money(buyTotal)}</strong></div>
              {demoUser?.isFounder && <small className={styles.founderUnlimited}>Founder · saldo tidak terbatas. Order akan matched jika ada penjual pada harga yang sesuai.</small>}
              <button type="button" className={styles.buyButton} onClick={buyShares} disabled={orderBusy}>{orderBusy ? "Memproses..." : "Beli CSCID"}</button>
            </> : <>
              <label htmlFor="cscid-sell-price">Harga jual per lembar (USD)</label>
              <input id="cscid-sell-price" type="number" min="0.01" step="0.01" value={sellPriceInput} onChange={(e) => setSellPriceInput(e.target.value)} />
              <label htmlFor="cscid-sell-qty">Jumlah lot (1 lot = 100 lembar)</label>
              <div className={styles.qtyPresets}>{presets.map((qty) => <button key={qty} type="button" className={Number(sellInput) === qty ? styles.qtyActive : ""} onClick={() => setQuantity(setSellInput, qty)}>{String(qty).replace(".", ",")}</button>)}<button type="button" onClick={() => setQuantity(setSellInput, maxSellLots)}>MAX</button></div>
              <input id="cscid-sell-qty" type="number" min="0.1" step="0.1" max={ownedLots} value={sellInput} onChange={(e) => setSellInput(e.target.value)} />
              <div className={styles.orderTotal}><span>Estimasi hasil jual</span><strong>{money(sellTotal)}</strong></div>
              <button type="button" className={styles.sellButton} onClick={sellShares} disabled={orderBusy}>{orderBusy ? "Memproses..." : "Jual CSCID"}</button>
            </>}
          </div>
        </div>

        <div className={styles.accountGrid}>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>SALDO TERSEDIA · {mode.toUpperCase()}</span>
            <strong>{demoUser?.isFounder ? "UNLIMITED" : demoUser ? money(balance) : "Login diperlukan"}</strong>
            <small>{demoUser?.isFounder ? "Saldo Founder tidak terbatas; MAX mengikuti jumlah saham yang sedang ditawarkan akun lain." : "Saldo bebas digunakan untuk membuat order"}</small>
            <small>Terkunci pada order beli: {money((marketData?.account?.lockedBalanceCents || 0) / 100)}</small>
          </div>
          <div className={styles.accountCard}>
            <span className={styles.sectionLabel}>PORTOFOLIO CSCID</span>
            <strong>{number(ownedLots)} lot / {number(ownedShares)} lembar</strong>
            <small>Nilai indikatif {money(owned * currentPrice)}</small>
            <small>Saham terkunci pada order jual: {number(marketData?.account?.lockedShares || 0)} lembar</small>
          </div>
        </div>

        {(notice || marketError) && <p className={styles.notice} role="status">{notice || marketError}</p>}

        <div className={styles.marketDepth}>
          <div className={styles.historyTitle}><h3>Order Book · Antrean Harga</h3><span>{midPrice ? `Mid-price ${money(midPrice)}` : "Mid-price belum tersedia"} · Live 4 detik</span></div>
          <div className={styles.depthColumns}>
            <div className={styles.depthColumn}>
              <strong className={styles.buyLabel}>BID · BELI</strong>
              <div className={styles.depthHeader}><span>Harga (USD)</span><span>Jumlah</span></div>
              {(marketData?.bids || []).length ? marketData.bids.map((item, i) => <div className={styles.depthRow} key={i} style={{background:`linear-gradient(90deg,rgba(8,153,129,.12) ${Math.min(100,item.quantity/maxDepth*100)}%,transparent 0)`}}><strong>{money(item.priceCents / 100)}</strong><span>{number(item.quantity)}</span></div>) : <p className={styles.empty}>Belum ada antrean beli.</p>}
            </div>
            <div className={styles.depthColumn}>
              <strong className={styles.sellLabel}>ASK · JUAL</strong>
              <div className={styles.depthHeader}><span>Harga (USD)</span><span>Jumlah</span></div>
              {(marketData?.asks || []).length ? marketData.asks.map((item, i) => <div className={styles.depthRow} key={i} style={{background:`linear-gradient(270deg,rgba(242,54,69,.12) ${Math.min(100,item.quantity/maxDepth*100)}%,transparent 0)`}}><strong>{money(item.priceCents / 100)}</strong><span>{number(item.quantity)}{item.source === "IPO" ? " · IPO" : ""}</span></div>) : <p className={styles.empty}>Belum ada antrean jual.</p>}
            </div>
          </div>
        </div>

        <div className={styles.history}>
          <div className={styles.historyTitle}><h3>Riwayat order</h3><span>{transactions.length} transaksi</span></div>
          {transactions.length === 0 ? <p className={styles.empty}>Belum ada transaksi yang matched di pasar.</p> : transactions.slice(0, 10).map((item) => (
            <div className={styles.historyRow} key={item.id}>
              <span className={item.type === "BUY" ? styles.buyLabel : item.type === "SELL" ? styles.sellLabel : ""}>{item.type}</span>
              <span>{number(item.qty)} lembar</span>
              <strong>{money(item.total)}</strong>
              <small>@ {money(item.price)} · {item.time}</small>
            </div>
          ))}
        </div>

        <div className={styles.history}>
          <div className={styles.historyTitle}><h3>Order Aktif Saya</h3><span>{(marketData?.orders || []).filter((o) => ["OPEN","PARTIAL"].includes(o.status)).length} antrean</span></div>
          {(marketData?.orders || []).filter((order) => ["OPEN","PARTIAL"].includes(order.status)).length === 0 ? <p className={styles.empty}>Tidak ada order aktif.</p> : (marketData?.orders || []).filter((order) => ["OPEN","PARTIAL"].includes(order.status)).map((order) => (
            <div className={styles.openOrderRow} key={order.id}>
              <span className={order.side === "BUY" ? styles.buyLabel : styles.sellLabel}>{order.side}</span>
              <span>{money(order.priceCents / 100)} · sisa {number(order.remaining)} lembar</span>
              <strong>{order.status}</strong>
              <button type="button" onClick={() => cancelOrder(order.id)}>Batalkan</button>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>Harga limit dan antrean order Demo diproses di server melalui mesin pencocokan harga-waktu. Saldo dan saham yang digunakan untuk order aktif dikunci; transaksi yang matched dicatat permanen dan memperbarui harga terakhir. IPO awal berjumlah 10.000 saham pada USD 1.000 per saham. Mode Demo dan Real memakai kode mesin bursa yang sama pada deployment serta database berbeda. Server Real belum disiapkan untuk menerima dana atau transaksi uang sungguhan.</p>
      </div>
    </section>
  );
}
