"use client";

import React, { useState } from 'react';
import { usePrice } from '@/context/PriceContext';
import styles from './Trade.module.css';

const Trade = () => {
  // [PATCH:TRADE-REAL-PRICE] harga CSC asli (USD per ton) dari PriceContext; null sampai termuat
  const { index } = usePrice();
  const livePrice = index && index.usd > 0 ? index.usd : null;
  const priceText = livePrice === null ? 'Memuat harga...' : '$' + livePrice.toFixed(2);

  const [balance, setBalance] = useState(10000.00);
  const [equity, setEquity] = useState(10000.00);
  const [floatingPnL, setFloatingPnL] = useState(0.00);
  const [leverage, setLeverage] = useState(50);
  const [lotSize, setLotSize] = useState(1.0);
  const [positions, setPositions] = useState([]);

  const handleOpenOrder = (type) => {
    if (livePrice === null) return;
    const newPosition = {
      id: Date.now(),
      type: type, // 'BUY' atau 'SELL'
      price: livePrice,
      lot: lotSize,
      pnl: 0.00
    };
    setPositions([...positions, newPosition]);
  };

  const handleCloseOrder = (id) => {
    setPositions(positions.filter(pos => pos.id !== id));
  };

  const handleCloseAll = () => {
    setPositions([]);
  };

  return (
    <section className={styles.tradeSection}>
      <div className={styles.tradeCard}>
        <div className={styles.tradeHeader}>
          <h2>MT5 Terminal Trade</h2>
          <span className={styles.livePriceBadge}>Live Price: {priceText}</span>
        </div>

        {/* Panel Akun: Balance, Equity, Floating PnL */}
        <div className={styles.accountMetrics}>
          <div className={styles.metricBox}>
            <span>Balance</span>
            <strong>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className={styles.metricBox}>
            <span>Equity</span>
            <strong>${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className={styles.metricBox}>
            <span>Floating PnL</span>
            <strong style={{ color: floatingPnL >= 0 ? '#16a34a' : '#dc2626' }}>
              ${floatingPnL.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Kontrol Leverage & Lot */}
        <div className={styles.controlPanel}>
          <div className={styles.controlGroup}>
            <label>Leverage:</label>
            <select value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className={styles.selectInput}>
              <option value={1}>1x</option>
              <option value={10}>10x</option>
              <option value={50}>50x</option>
              <option value={100}>100x</option>
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Lot Size:</label>
            <input 
              type="number" 
              step="0.1" 
              min="0.1" 
              value={lotSize} 
              onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.1)} 
              className={styles.numberInput} 
            />
          </div>
        </div>

        {/* Tombol Eksekusi Buy / Sell */}
        <div className={styles.executionButtons}>
          <button onClick={() => handleOpenOrder('BUY')} className={styles.buyBtn} disabled={livePrice === null}>
            BUY / LONG @ {priceText}
          </button>
          <button onClick={() => handleOpenOrder('SELL')} className={styles.sellBtn} disabled={livePrice === null}>
            SELL / SHORT @ {priceText}
          </button>
        </div>

        {/* Tabel Posisi Terbuka */}
        <div className={styles.positionsWrapper}>
          <div className={styles.positionsHeader}>
            <h3>Posisi Terbuka ({positions.length})</h3>
            {positions.length > 0 && (
              <button onClick={handleCloseAll} className={styles.closeAllBtn}>Tutup Semua</button>
            )}
          </div>

          {positions.length === 0 ? (
            <p className={styles.noPositionText}>Tidak ada posisi trading aktif.</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.positionTable}>
                <thead>
                  <tr>
                    <th>Tipe</th>
                    <th>Harga Masuk</th>
                    <th>Lot</th>
                    <th>PnL</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => (
                    <tr key={pos.id}>
                      <td style={{ color: pos.type === 'BUY' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{pos.type}</td>
                      <td>${pos.price.toFixed(2)}</td>
                      <td>{pos.lot}</td>
                      <td style={{ color: '#16a34a' }}>$0.00</td>
                      <td>
                        <button onClick={() => handleCloseOrder(pos.id)} className={styles.closeItemBtn}>Close</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Trade;
