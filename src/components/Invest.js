"use client";

import React, { useState } from 'react';
import { useAccount } from './Account'; 
import Login from './Login';
import styles from './Invest.module.css';

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, logout } = useAccount();
  
  // State Navigasi & Keamanan
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // State Form Investasi Baru
  const [isInvestingFlow, setIsInvestingFlow] = useState(false);
  const [invData, setInvData] = useState({
    ton: 1,
    currency: 'IDR', // IDR atau USD
    broker: '',
    mitra: 'PT. Tunas Kembar Abadi',
    payment: 'bank' // 'bank' atau 'qris'
  });
  const [invAgreed, setInvAgreed] = useState(false);
  const [invShake, setInvShake] = useState(false);

  // Harga Dasar
  const PRICE_PER_TON_IDR = 10500000;
  const USD_EXCHANGE_RATE = 15500; // Asumsi 1 USD = Rp 15.500

  const handleLogout = () => {
    logout();
    setInvested(false); 
    setActiveTab('invest');
    setMenuOpen(false);
    setIsInvestingFlow(false);
  };

  const handleTradeAccessCheck = (e) => {
    e.preventDefault();
    if (passwordInput.trim().toLowerCase() === "coconut shell charcoal") {
      setPasswordError(false);
      setPasswordInput("");
      setShowPasswordModal(false);
      setActiveTab('trade');
    } else {
      setPasswordError(true);
    }
  };

  const handleMenuClick = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'beranda':
        const berandaEl = document.getElementById('beranda');
        if (berandaEl) berandaEl.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'profil':
        alert(user ? `Profil: ${user.name} (${user.email})` : "Silakan login terlebih dahulu.");
        break;
      case 'portofolio':
        alert(invested ? `Portofolio: ${invData.ton} Ton Komoditas Arang.` : "Portofolio kosong.");
        break;
      case 'riwayat':
        alert("Riwayat transaksi kosong.");
        break;
      case 'pengaturan':
        alert("Menu pengaturan akun.");
        break;
      case 'keluar':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!invAgreed) {
      setInvShake(true);
      setTimeout(() => setInvShake(false), 600);
      return;
    }
    if (!invData.broker) {
      alert("Harap pilih Broker pendamping Anda.");
      return;
    }

    setInvested(true);
    setIsInvestingFlow(false);
    alert(`Pembayaran berhasil diproses!\n\nInvestasi sebesar ${invData.ton} Ton melalui mitra ${invData.mitra} telah masuk ke portofolio Anda.`);
  };

  // Format Mata Uang
  const currentTotalIdr = invData.ton * PRICE_PER_TON_IDR;
  const displayTotal = invData.currency === 'IDR' 
    ? `Rp ${currentTotalIdr.toLocaleString('id-ID')}`
    : `$ ${(currentTotalIdr / USD_EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className={styles.investSection} style={{ position: 'relative' }}>
      <div className={styles.investCard}>
        
        {/* Tombol Menu Dropdown (Hanya Muncul Jika Sudah Login & Tidak Di Flow Investasi) */}
        {user && !isInvestingFlow && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px',
                  borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#111827',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Menu ☰
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '42px', right: '0', background: '#ffffff',
                  border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50, minWidth: '160px', padding: '6px'
                }}>
                  <button onClick={() => handleMenuClick('beranda')} style={menuItemStyle}>Beranda</button>
                  <button onClick={() => handleMenuClick('profil')} style={menuItemStyle}>Profil</button>
                  <button onClick={() => handleMenuClick('portofolio')} style={menuItemStyle}>Portofolio</button>
                  <button onClick={() => handleMenuClick('riwayat')} style={menuItemStyle}>Riwayat</button>
                  <button onClick={() => handleMenuClick('pengaturan')} style={menuItemStyle}>Pengaturan</button>
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>
                  <button onClick={() => handleMenuClick('keluar')} style={{ ...menuItemStyle, color: '#dc2626' }}>Keluar</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ filter: showPasswordModal ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <div className={styles.actionWrapper}>
            {!user ? (
              <Login />
            ) : (
              <div className={styles.userDashboard}>
                
                {/* --- TAMPILAN 1: DASBOR UTAMA (BERANDA INVEST) --- */}
                {!isInvestingFlow && (
                  <>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#c45e20', marginBottom: '4px' }}>Investasi CSCID</h2>
                    
                    <div className={styles.userInfo} style={{ marginTop: '12px' }}>
                      <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" className={styles.avatar} />
                      <span>Halo, <strong>{user.name}</strong></span>
                      <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', margin: '20px 0', width: '100%', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setActiveTab('invest')}
                        style={{
                          flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer',
                          background: activeTab === 'invest' ? '#c45e20' : '#f3f4f6',
                          color: activeTab === 'invest' ? '#fff' : '#4b5563', border: 'none', transition: '0.2s'
                        }}
                      >
                        Menu Investasi
                      </button>

                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        style={{
                          flex: 1, padding: '10px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer',
                          background: activeTab === 'trade' ? '#c45e20' : '#f3f4f6',
                          color: activeTab === 'trade' ? '#fff' : '#4b5563', border: 'none', transition: '0.2s'
                        }}
                      >
                        MT5 Terminal Trade 🔐
                      </button>
                    </div>

                    {invested ? (
                      <div style={{ padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
                        <h4 style={{ color: '#047857', margin: '0 0 8px 0' }}>Investasi Aktif!</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Anda memiliki portofolio sebesar <b>{invData.ton} Ton</b>.</p>
                        <button onClick={() => setIsInvestingFlow(true)} style={{ marginTop: '14px', padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          TAMBAH INVESTASI
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px' }}>
                          Amankan alokasi kuota komoditas ekspor Anda sekarang.
                        </span>
                        <button onClick={() => setIsInvestingFlow(true)} className={styles.investBtn}>
                          MULAI INVESTASI BARU
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* --- TAMPILAN 2: FORMULIR PEMESANAN INVESTASI --- */}
                {isInvestingFlow && (
                  <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
                      Detail Pembelian Komoditas
                    </h3>

                    <form onSubmit={handleProcessPayment}>
                      {/* Input Ton & Mata Uang */}
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Jumlah (Ton)</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={invData.ton} 
                            onChange={(e) => setInvData({...invData, ton: Math.max(1, parseInt(e.target.value) || 1)})}
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ width: '100px' }}>
                          <label style={labelStyle}>Mata Uang</label>
                          <select 
                            value={invData.currency} 
                            onChange={(e) => setInvData({...invData, currency: e.target.value})}
                            style={inputStyle}
                          >
                            <option value="IDR">IDR</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      {/* Tampilan Total Harga */}
                      <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fde68a' }}>
                        <span style={{ display: 'block', fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>Total Tagihan:</span>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#b45309' }}>{displayTotal}</span>
                      </div>

                      {/* Pilihan Broker */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Pilih Broker</label>
                        <select 
                          value={invData.broker} 
                          onChange={(e) => setInvData({...invData, broker: e.target.value})}
                          style={inputStyle}
                        >
                          <option value="" disabled>-- Pilih Broker Pendamping --</option>
                          <option value="Broker Alpha (ID: A01)">Broker Alpha (ID: A01)</option>
                          <option value="Broker Beta (ID: B09)">Broker Beta (ID: B09)</option>
                          <option value="Broker Global Ekspor">Broker Global Ekspor</option>
                        </select>
                      </div>

                      {/* Pilihan Mitra PT */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Mitra Perusahaan (PT)</label>
                        <select 
                          value={invData.mitra} 
                          onChange={(e) => setInvData({...invData, mitra: e.target.value})}
                          style={inputStyle}
                        >
                          <option value="PT. Tunas Kembar Abadi">PT. Tunas Kembar Abadi</option>
                          <option value="PT. Arang Nusantara Jaya">PT. Arang Nusantara Jaya</option>
                          <option value="PT. Indo Charcoal Ekspor">PT. Indo Charcoal Ekspor</option>
                        </select>
                      </div>

                      {/* Metode Pembayaran */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Metode Pembayaran</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <label style={{...radioContainerStyle, border: invData.payment === 'bank' ? '2px solid #c45e20' : '1px solid #e5e7eb'}}>
                            <input type="radio" name="pay" value="bank" checked={invData.payment === 'bank'} onChange={() => setInvData({...invData, payment: 'bank'})} style={{display: 'none'}} />
                            💳 Transfer Bank
                          </label>
                          <label style={{...radioContainerStyle, border: invData.payment === 'qris' ? '2px solid #c45e20' : '1px solid #e5e7eb'}}>
                            <input type="radio" name="pay" value="qris" checked={invData.payment === 'qris'} onChange={() => setInvData({...invData, payment: 'qris'})} style={{display: 'none'}} />
                            📱 QRIS
                          </label>
                        </div>
                      </div>

                      {/* Detail Pembayaran (Dinamis) */}
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        {invData.payment === 'bank' ? (
                          <>
                            <h5 style={{ margin: '0 0 8px 0', color: '#334155' }}>Instruksi Transfer Bank</h5>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Bank: <b>BCA (Bank Central Asia)</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>No. Rekening: <b style={{ fontSize: '16px', color: '#0f172a' }}>869 1234 5678</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Atas Nama: <b>{invData.mitra}</b></p>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#334155' }}>Scan QRIS Perusahaan</h5>
                            <div style={{ width: '120px', height: '120px', background: '#cbd5e1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #94a3b8' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>[Mockup QRIS]</span>
                            </div>
                            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#475569' }}>A.n <b>{invData.mitra}</b></p>
                          </div>
                        )}
                      </div>

                      {/* Syarat & Ketentuan */}
                      <div className={invShake ? styles.shakeRed : ''} style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', color: invShake ? '#dc2626' : '#4b5563', fontWeight: invShake ? 'bold' : 'normal' }}>
                          <input 
                            type="checkbox" 
                            checked={invAgreed} 
                            onChange={(e) => setInvAgreed(e.target.checked)} 
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c45e20' }}
                          />
                          Saya menyetujui seluruh Syarat, Ketentuan, dan Risiko Investasi.
                        </label>
                      </div>

                      {/* Tombol Aksi */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setIsInvestingFlow(false)} style={{ flex: 1, padding: '14px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          BATAL
                        </button>
                        <button type="submit" style={{ flex: 2, padding: '14px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                          BAYAR SEKARANG
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Password Terminal Trade */}
        {showPasswordModal && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(4px)', borderRadius: '24px'
          }}>
            <form onSubmit={handleTradeAccessCheck} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 360, padding: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>Sandi Terminal Trade</h4>
                <p style={{ margin: '6px 0 12px 0', color: '#6b7280', fontSize: '13px' }}>Masukkan sandi untuk mengakses terminal.</p>
              </div>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                placeholder="Kata Sandi"
                autoComplete="off"
                style={{ flex: '1 1 220px', minWidth: 0, padding: '12px', border: `1px solid ${passwordError ? '#f23645' : '#e0e3eb'}`, borderRadius: '10px', fontSize: 14, outline: 'none', background: '#f9fafb', color: '#111', width: '100%' }}
              />
              {passwordError && <span style={{ width: '100%', textAlign: 'center', color: '#f23645', fontSize: 12, marginTop: '-4px' }}>Password salah. (Hint: coconut shell charcoal)</span>}
              <div style={{ display: 'flex', width: '100%', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>BATAL</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>BUKA</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};

// Styling Objek Inline agar kode rapi
const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: '600', color: '#4b5563', marginBottom: '6px'
};

const inputStyle = {
  width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827'
};

const radioContainerStyle = {
  flex: 1, padding: '12px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer', background: '#fff', fontSize: '14px', fontWeight: 'bold', color: '#374151', transition: 'all 0.2s ease'
};

const menuItemStyle = {
  display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderRadius: '8px', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#4b5563', cursor: 'pointer', textAlign: 'left'
};

export default Invest;
