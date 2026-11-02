"use client";

import React, { useState } from 'react';
import { useAccount } from './Account'; 
import styles from './Trade.module.css';

export default function Trade() {
  const { user, login } = useAccount(); 
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy'); 
  const [successMsg, setSuccessMsg] = useState('');

  const handleTradeSubmit = (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (tradeType === 'sellAll') {
      setSuccessMsg(`Berhasil mengeksekusi perintah SELL ALL untuk seluruh aset Arang Tempurung Kelapa milik ${user.name}.`);
    } else {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert('Masukkan jumlah ton yang valid.');
        return;
      }
      setSuccessMsg(`Berhasil menempatkan order ${tradeType.toUpperCase()} sebesar ${amount} Ton Arang Tempurung Kelapa untuk ${user.name}.`);
    }
    
    setAmount('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <section className={styles.tradeSection}>
      <div className={styles.tradeCard}>
        <div className={styles.tradeHeader}>
          <span className={styles.eyebrow}>Platform Trading CSCID</span>
          <span className={styles.subtitle}>Eksekusi order beli atau jual komoditas secara instan</span>
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
            <button
              type="button"
              className={`${styles.tabBtn} ${tradeType === 'sellAll' ? styles.sellActive : ''}`}
              onClick={() => {
                setTradeType('sellAll');
                setAmount('ALL');
              }}
            >
              Sell All
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="tradeAmount">Jumlah (Ton)</label>
            <input
              id="tradeAmount"
              type={tradeType === 'sellAll' ? 'text' : 'number'}
              min="1"
              placeholder={tradeType === 'sellAll' ? "Seluruh Saldo Aset" : "Contoh: 10"}
              value={tradeType === 'sellAll' ? 'MAKSIMAL (SELL ALL)' : amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={tradeType === 'sellAll' || !user} 
              className={styles.tradeInput}
            />
          </div>

          {!user ? (
            <button 
              type="button" 
              onClick={login} 
              className={styles.submitBtn} 
              style={{ backgroundColor: '#4285F4', color: '#fff' }}
            >
              LOGIN UNTUK TRADING
            </button>
          ) : (
            <button type="submit" className={`${styles.submitBtn} ${tradeType === 'buy' ? styles.buyBtnBg : styles.sellBtnBg}`}>
              Eksekusi {tradeType === 'sellAll' ? 'SELL ALL' : tradeType.toUpperCase()}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
