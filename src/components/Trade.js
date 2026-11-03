"use client";

import { useState } from "react";
import { useAccount } from "@/components/Account";
import { usePrice } from "@/components/PriceContext"; // Sesuaikan path jika berbeda
import styles from "./Trade.module.css";

export default function Trade() {
  const { user } = useAccount();
  const { livePrice } = usePrice();
  
  // State Trading Core
  const [balance, setBalance] = useState(10000.00); // Saldo awal $10,000
  const [amount, setAmount] = useState(1);
  const [leverage, setLeverage] = useState(100);
  const [positions, setPositions] = useState([]);
  const [notification, setNotification] = useState(null);

  // Harga Market Real-time
  const currentMarketPrice = livePrice || 1250.50;
  const spread = 0.50;
  const askPrice = currentMarketPrice + (spread / 2);
  const bidPrice = currentMarketPrice - (spread / 2);

  // Kalkulasi PnL Real-time per Posisi
  const getPositionPnL = (pos) => {
    const diff = pos.type === 'BUY' ? (currentMarketPrice - pos.openPrice) : (pos.openPrice - currentMarketPrice);
    return diff * pos.amount; // Profit/Loss nominal
  };

  const getPositionPnLPct = (pos) => {
    const pnl = getPositionPnL(pos);
    const margin = (pos.openPrice * pos.amount) / pos.leverage;
    return (pnl / margin) * 100; // Return on Equity (Margin) %
  };

  // Kalkulasi Total Akun
  const totalPnL = positions.reduce((acc, pos) => acc + getPositionPnL(pos), 0);
  const equity = balance + totalPnL;

  // Fungsi Eksekusi
  const executeOrder = (type) => {
    if (!user) {
      alert("Silakan Login terlebih dahulu untuk melakukan transaksi!");
      return;
    }

    const execPrice = type === 'BUY' ? askPrice : bidPrice;
    const marginRequired = (execPrice * amount) / leverage;

    if (balance < marginRequired) {
      alert("Margin tidak cukup! Kurangi volume atau tambah saldo.");
      return;
    }

    const newPosition = {
      id: Date.now(),
      type: type,
      amount: amount,
      leverage: leverage,
      openPrice: execPrice,
      time: new Date().toLocaleTimeString('id-ID', { hour12: false }),
    };

    setPositions([newPosition, ...positions]);
    showNotif(`🟢 Berhasil Eksekusi ${type} ${amount} TON di harga $${execPrice.toFixed(2)}`);
  };

  // Fungsi Close Order
  const closePosition = (id) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    const pnl = getPositionPnL(pos);
    setBalance(prev => prev + pnl);
    setPositions(prev => prev.filter(p => p.id !== id));
    showNotif(`🔴 Posisi Ditutup. PnL: $${pnl.toFixed(2)}`);
  };

  const closeBulk = (filterFn, actionName) => {
    const toClose = positions.filter(filterFn);
    if (toClose.length === 0) return;
    
    let realizedPnL = 0;
    toClose.forEach(pos => { realizedPnL += getPositionPnL(pos); });
    
    setBalance(prev => prev + realizedPnL);
    setPositions(prev => prev.filter(p => !filterFn(p)));
    showNotif(`🔴 ${actionName} Berhasil. Total PnL: $${realizedPnL.toFixed(2)}`);
  };

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <section id="trade" className={styles.tradeSection}>
      <div className={styles.tradeContainer}>
        
        {/* Header & Account Summary */}
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.tradeTitle}>TERMINAL // CHARCOAL X</h2>
            <div className={styles.accountStats}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Saldo (Balance)</span>
                <span className={styles.statValue}>${balance.toFixed(2)}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Ekuitas (Equity)</span>
                <span className={`${styles.statValue} ${totalPnL < 0 ? styles.textRed : styles.textGreen}`}>
                  ${equity.toFixed(2)}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Floating PnL</span>
                <span className={`${styles.statValue} ${totalPnL < 0 ? styles.textRed : styles.textGreen}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.livePrices}>
            <div className={styles.priceBoxSell}>
              <span>BID (SELL)</span>
              <strong>${bidPrice.toFixed(2)}</strong>
            </div>
            <div className={styles.priceBoxBuy}>
              <span>ASK (BUY)</span>
              <strong>${askPrice.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {notification && <div className={styles.notificationBanner}>{notification}</div>}

        <div className={styles.tradeGrid}>
          
          {/* KIRI: Control Panel (Order) */}
          <div className={styles.controlPanel}>
            <div className={styles.panelSection}>
              <label className={styles.label}>Leverage</label>
              <select 
                className={styles.selectInput} 
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))}
              >
                <option value="1">1x (Spot)</option>
                <option value="10">10x</option>
                <option value="50">50x</option>
                <option value="100">100x</option>
              </select>
            </div>

            <div className={styles.panelSection}>
              <label className={styles.label}>Volume (TON)</label>
              <div className={styles.amountBox}>
                <button onClick={() => setAmount(Math.max(1, amount - 1))} className={styles.amountBtn}>-</button>
                <input 
                  type="number" min="1" max="1000" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value) || 1)}
                  className={styles.amountInput}
                />
                <button onClick={() => setAmount(amount + 1)} className={styles.amountBtn}>+</button>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button onClick={() => executeOrder("SELL")} className={styles.sellBtn}>
                <span className={styles.btnTitle}>SELL</span>
                <span className={styles.btnSub}>Mkt ${bidPrice.toFixed(2)}</span>
              </button>
              <button onClick={() => executeOrder("BUY")} className={styles.buyBtn}>
                <span className={styles.btnTitle}>BUY</span>
                <span className={styles.btnSub}>Mkt ${askPrice.toFixed(2)}</span>
              </button>
            </div>
            {!user && <p className={styles.warningText}>* Login Google untuk trading.</p>}
          </div>

          {/* KANAN: Positions & Bulk Actions */}
          <div className={styles.infoPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Posisi Aktif ({positions.length})</h3>
              <div className={styles.bulkActions}>
                <button onClick={() => closeBulk(() => true, "Close All")} className={styles.bulkBtn}>Close All</button>
                <button onClick={() => closeBulk(p => p.type === 'BUY', "Close Buy")} className={styles.bulkBtn}>Close Buy</button>
                <button onClick={() => closeBulk(p => p.type === 'SELL', "Close Sell")} className={styles.bulkBtn}>Close Sell</button>
                <button onClick={() => closeBulk(p => getPositionPnL(p) > 0, "Close Profit")} className={styles.bulkBtnProfit}>Close Profit</button>
                <button onClick={() => closeBulk(p => getPositionPnL(p) < 0, "Close Loss")} className={styles.bulkBtnLoss}>Close Loss</button>
              </div>
            </div>

            <div className={styles.positionsList}>
              {positions.length === 0 ? (
                <div className={styles.emptyState}>Tidak ada posisi terbuka.</div>
              ) : (
                <table className={styles.posTable}>
                  <thead>
                    <tr>
                      <th>Simbol</th>
                      <th>Size</th>
                      <th>Open</th>
                      <th>Current</th>
                      <th style={{textAlign: 'right'}}>PnL (ROE%)</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => {
                      const pnl = getPositionPnL(pos);
                      const pnlPct = getPositionPnLPct(pos);
                      const isProfit = pnl >= 0;
                      return (
                        <tr key={pos.id}>
                          <td>
                            <span className={pos.type === 'BUY' ? styles.badgeBuy : styles.badgeSell}>
                              {pos.type} {pos.leverage}x
                            </span>
                          </td>
                          <td>{pos.amount} TON</td>
                          <td>${pos.openPrice.toFixed(2)}</td>
                          <td>${currentMarketPrice.toFixed(2)}</td>
                          <td style={{textAlign: 'right'}} className={isProfit ? styles.textGreen : styles.textRed}>
                            <strong>{isProfit ? '+' : ''}${pnl.toFixed(2)}</strong>
                            <div className={styles.pnlPct}>{isProfit ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                          </td>
                          <td style={{textAlign: 'center'}}>
                            <button onClick={() => closePosition(pos.id)} className={styles.closeBtn}>X</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
