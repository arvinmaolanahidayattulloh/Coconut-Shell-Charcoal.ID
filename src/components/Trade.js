"use client";

import React, { useState } from 'react';
import styles from './Trade.module.css';

export default function Trade() {
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTradeSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('Masukkan jumlah ton yang valid.');
      return;
    }
    setSuccessMsg(`Berhasil menempatkan order ${tradeType.toUpperCase()} sebesar ${amount} Ton Arang Tempurung Kelapa.`);
    setAmount('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <section className={styles.tradeSection}>
      <div className={styles.tradeCard}>
        <div className={styles.tradeHeader}>
          <h3 className={styles.eyebrow}>Platform Trading CSCID</h3>
          <p className={styles.subtitle}>Eksekusi order beli atau jual secara instan</p>
        </div>

        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        <form onSubmit={handleTradeSubmit} className={styles.tradeForm}>
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tradeType === 'buy' ? styles.buyActive : ''}`}
              onClick={() => setTradeType('buy')}
            >
              Beli (Long)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tradeType === 'sell' ? styles.sellActive : ''}`}
              onClick={() => setTradeType('sell')}
            >
              Jual (Short)
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="tradeAmount">Jumlah (Ton)</label>
            <input
              id="tradeAmount"
              type="number"
              min="1"
              placeholder="Contoh: 10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.tradeInput}
            />
          </div>

          <button type="submit" className={`${styles.submitBtn} ${tradeType === 'buy' ? styles.buyBtnBg : styles.sellBtnBg}`}>
            Eksekusi {tradeType.toUpperCase()}
          </button>
        </form>
      </div>
    </section>
  );
}
