"use client";

import { useState } from "react";
import { useAccount } from "@/components/Account";
import { usePrice } from "@/context/PriceContext";
import styles from "./Trade.module.css";

export default function Trade() {
  const { user } = useAccount();
  const { livePrice } = usePrice();
  const [amount, setAmount] = useState(1);
  const [activeTab, setActiveTab] = useState("market");
  const [positions, setPositions] = useState([]);
  const [notification, setNotification] = useState(null);

  // Dynamic MT5 pricing based on live chart price
  const askPrice = livePrice + 0.20;
  const bidPrice = livePrice - 0.20;

  const handleAmountChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    if (val < 1) val = 1;
    setAmount(val);
  };

  const executeOrder = (type) => {
    if (!user) {
      alert("Silakan Login terlebih dahulu untuk melakukan transaksi!");
      return;
    }

    const executedPrice = type === "BUY" ? askPrice : bidPrice;

    const newPosition = {
      id: Date.now(),
      type: type,
      amount: amount,
      price: executedPrice,
      time: new Date().toLocaleTimeString(),
    };

    setPositions([newPosition, ...positions]);
    setNotification(`Berhasil Eksekusi ${type} ${amount} TON di harga $${executedPrice.toFixed(2)}`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <section id="trade" className={styles.tradeSection}>
      <div className={styles.tradeContainer}>
        
        <div className={styles.tradeHeader}>
          <div>
            <h2 className={styles.tradeTitle}>MT5 TERMINAL // CSC INDEX</h2>
            <p className={styles.tradeSubtitle}>Pair: CSC / USD | Live Market Feed</p>
          </div>
          <div>
            <span className={styles.askBadge}>
              LIVE: ${livePrice.toFixed(2)}
            </span>
          </div>
        </div>

        {notification && (
          <div className={styles.notificationBanner}>
            {notification}
          </div>
        )}

        <div className={styles.tradeGrid}>
          
          <div className={styles.controlPanel}>
            <h3 className={styles.panelTitle}>Order Panel</h3>
            
            <div>
              <label className={styles.label}>Volume (TON) - Maks 100</label>
              <div className={styles.amountBox}>
                <button 
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                  className={styles.amountBtn}
                >-</button>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={amount} 
                  onChange={handleAmountChange}
                  className={styles.amountInput}
                />
                <button 
                  onClick={() => setAmount(Math.min(100, amount + 1))}
                  className={styles.amountBtn}
                >+</button>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button 
                onClick={() => executeOrder("SELL")}
                className={styles.sellBtn}
              >
                <span className={styles.btnSubText}>Sell (Jual)</span>
                <span className={styles.btnPriceText}>${bidPrice.toFixed(2)}</span>
              </button>

              <button 
                onClick={() => executeOrder("BUY")}
                className={styles.buyBtn}
              >
                <span className={styles.btnSubText}>Buy (Beli)</span>
                <span className={styles.btnPriceText}>${askPrice.toFixed(2)}</span>
              </button>
            </div>

            {!user && (
              <p className={styles.warningText}>
                * Anda harus login Google terlebih dahulu untuk mengeksekusi order.
              </p>
            )}
          </div>

          <div className={styles.infoPanel}>
            <div className={styles.tabHeader}>
              <button 
                onClick={() => setActiveTab("market")}
                className={styles.tabActive}
              >
                Posisi Aktif ({positions.length})
              </button>
            </div>

            <div className={styles.positionsList}>
              {positions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Belum ada posisi terbuka.</p>
                  <p>Lakukan Buy atau Sell untuk melihat harga eksekusi.</p>
                </div>
              ) : (
                positions.map((pos) => (
                  <div key={pos.id} className={styles.positionItem}>
                    <div>
                      <span className={pos.type === 'BUY' ? styles.badgeBuy : styles.badgeSell}>
                        {pos.type}
                      </span>
                      <span style={{ color: '#d1d5db' }}>{pos.amount} TON</span>
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>({pos.time})</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#9ca3af', fontSize: '0.65rem' }}>Harga Beli (Open):</div>
                      <div style={{ color: '#34d399', fontWeight: 'bold' }}>${pos.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
