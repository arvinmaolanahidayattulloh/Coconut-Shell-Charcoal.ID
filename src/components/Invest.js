"use client";

import React, { useState } from 'react';
import { useAccount } from './Account'; 
import Login from './Login';
import styles from './Invest.module.css';

// 1. IMPORT DATA DARI Mitra.js
import { partnersData } from './Mitra'; 

const Invest = ({ invested, setInvested, activeTab, setActiveTab }) => {
  const { user, logout } = useAccount();
  
  // State Navigasi & Keamanan
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Set default mitra dari data pertama di Mitra.js (jika ada)
  const defaultMitra = partnersData && partnersData.length > 0 ? partnersData[0].name : 'PT. Tunas Kembar Abadi';

  // State Form Investasi Baru
  const [isInvestingFlow, setIsInvestingFlow] = useState(false);
  const [invData, setInvData] = useState({
    ton: 1,
    currency: 'IDR',
    mitra: defaultMitra,
    payment: 'bank',
    senderName: '',
    senderBank: '',
    proofFile: null
  });
  
  const [invAgreed, setInvAgreed] = useState(false);
  const [invShake, setInvShake] = useState(false);
  const [showTerms, setShowTerms] = useState(false); 

  // Harga Dasar
  const PRICE_PER_TON_IDR = 10500000;
  const USD_EXCHANGE_RATE = 15500;

  // 2. AMBIL DATA REKENING BANK OTOMATIS BERDASARKAN MITRA YANG DIPILIH
  const selectedMitraData = partnersData.find(p => p.name === invData.mitra) || partnersData[0];

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
      case 'trade':
        setShowPasswordModal(true); 
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

    setInvested(true);
    setIsInvestingFlow(false);
    alert(`Pembayaran berhasil dikonfirmasi!\n\nNama: ${invData.senderName}\nBank: ${invData.senderBank}\nInvestasi sebesar ${invData.ton} Ton pada ${invData.mitra} akan segera diverifikasi oleh sistem.`);
  };

  const currentTotalIdr = invData.ton * PRICE_PER_TON_IDR;
  const displayTotal = invData.currency === 'IDR' 
    ? `Rp ${currentTotalIdr.toLocaleString('id-ID')}`
    : `$ ${(currentTotalIdr / USD_EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className={styles.investSection} style={{ position: 'relative' }}>
      <div className={styles.investCard}>
        
        {/* HEADER UTAMA: Judul & Menu Sejajar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#c45e20', margin: 0 }}>Investasi CSCID</h2>
          
          {user && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: '#ffffff', border: '1px solid #e5e7eb', padding: '8px 14px',
                  borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#111827',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                Menu ☰
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '46px', right: '0', background: '#ffffff',
                  border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50, minWidth: '180px', padding: '6px'
                }}>
                  <button onClick={() => handleMenuClick('beranda')} style={menuItemStyle}>Beranda</button>
                  <button onClick={() => handleMenuClick('profil')} style={menuItemStyle}>Profil</button>
                  <button onClick={() => handleMenuClick('trade')} style={{ ...menuItemStyle, color: '#c45e20', fontWeight: '700' }}>
                    MT5 Terminal Trade 🔐
                  </button>
                  <button onClick={() => handleMenuClick('portofolio')} style={menuItemStyle}>Portofolio</button>
                  <button onClick={() => handleMenuClick('riwayat')} style={menuItemStyle}>Riwayat</button>
                  <button onClick={() => handleMenuClick('pengaturan')} style={menuItemStyle}>Pengaturan</button>
                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>
                  <button onClick={() => handleMenuClick('keluar')} style={{ ...menuItemStyle, color: '#dc2626' }}>Keluar</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ filter: showPasswordModal ? 'blur(5px)' : 'none', transition: 'filter 0.2s ease' }}>
          <div className={styles.actionWrapper}>
            {!user ? (
              <Login />
            ) : (
              <div className={styles.userDashboard}>
                
                {!isInvestingFlow && (
                  <>
                    <div className={styles.userInfo} style={{ marginBottom: '24px' }}>
                      <img src={user.picture || 'https://via.placeholder.com/40'} alt="Profile" className={styles.avatar} />
                      <span>Halo, <strong>{user.name}</strong></span>
                      <button onClick={handleLogout} className={styles.logoutBtn}>KELUAR</button>
                    </div>

                    {invested ? (
                      <div style={{ padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
                        <h4 style={{ color: '#047857', margin: '0 0 8px 0', fontSize: '18px' }}>Investasi Aktif!</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>Anda memiliki portofolio sebesar <b>{invData.ton} Ton</b> pada <b>{invData.mitra}</b>.</p>
                        <button onClick={() => setIsInvestingFlow(true)} style={{ marginTop: '16px', padding: '12px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                          TAMBAH INVESTASI
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.subtitle} style={{ display: 'block', marginBottom: '16px', fontSize: '14px' }}>
                          Amankan alokasi kuota komoditas ekspor Anda sekarang.
                        </span>
                        <button onClick={() => setIsInvestingFlow(true)} className={styles.investBtn} style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                          MULAI INVESTASI BARU
                        </button>
                      </>
                    )}
                  </>
                )}

                {isInvestingFlow && (
                  <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                    
                    <form onSubmit={handleProcessPayment}>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Jumlah Investasi (Ton)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#f9fafb', flex: 1, overflow: 'hidden' }}>
                            <button type="button" onClick={() => setInvData({...invData, ton: Math.max(1, invData.ton - 1)})} style={qtyBtnStyle}>-</button>
                            <input 
                              type="number" min="1" value={invData.ton} 
                              onChange={(e) => setInvData({...invData, ton: Math.max(1, parseInt(e.target.value) || 1)})}
                              style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 'bold', border: 'none', background: 'transparent', outline: 'none', color: '#111827' }}
                            />
                            <button type="button" onClick={() => setInvData({...invData, ton: invData.ton + 1})} style={qtyBtnStyle}>+</button>
                          </div>
                          
                          <select value={invData.currency} onChange={(e) => setInvData({...invData, currency: e.target.value})} style={{ width: '100px', ...inputStyle }}>
                            <option value="IDR">IDR</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fde68a' }}>
                        <span style={{ display: 'block', fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>Total Tagihan Pembayaran:</span>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: '#b45309' }}>{displayTotal}</span>
                      </div>

                      {/* 3. LOOPING NAMA PERUSAHAAN DARI Mitra.js */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Mitra Broker / Perusahaan (PT)</label>
                        <select value={invData.mitra} onChange={(e) => setInvData({...invData, mitra: e.target.value})} style={inputStyle}>
                          {partnersData && partnersData.length > 0 ? (
                            partnersData.map((mitra) => (
                              <option key={mitra.id} value={mitra.name}>{mitra.name}</option>
                            ))
                          ) : (
                            <option value="PT. Tunas Kembar Abadi">PT. Tunas Kembar Abadi</option>
                          )}
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Metode Pembayaran</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <label style={{...radioContainerStyle, border: invData.payment === 'bank' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'bank' ? '#fff7ed' : '#fff'}}>
                            <input type="radio" name="pay" value="bank" checked={invData.payment === 'bank'} onChange={() => setInvData({...invData, payment: 'bank'})} style={{display: 'none'}} />
                            💳 Transfer Bank
                          </label>
                          <label style={{...radioContainerStyle, border: invData.payment === 'qris' ? '2px solid #c45e20' : '1px solid #e5e7eb', background: invData.payment === 'qris' ? '#fff7ed' : '#fff'}}>
                            <input type="radio" name="pay" value="qris" checked={invData.payment === 'qris'} onChange={() => setInvData({...invData, payment: 'qris'})} style={{display: 'none'}} />
                            📱 QRIS
                          </label>
                        </div>
                      </div>

                      {/* 4. DETAIL REKENING DINAMIS DARI Mitra.js */}
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        {invData.payment === 'bank' ? (
                          <>
                            <h5 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '14px' }}>Tujuan Transfer Bank</h5>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Bank: <b>{selectedMitraData?.bank || 'BCA (Bank Central Asia)'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>No. Rekening: <b style={{ fontSize: '18px', color: '#0f172a' }}>{selectedMitraData?.noRekening || '869 1234 5678'}</b></p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#475569' }}>Atas Nama: <b>{selectedMitraData?.anRekening || invData.mitra}</b></p>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '14px' }}>Scan QRIS Resmi</h5>
                            <div style={{ width: '140px', height: '140px', background: '#cbd5e1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #94a3b8' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>[Mockup QRIS]</span>
                            </div>
                            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#475569' }}>A.n <b>{selectedMitraData?.anRekening || invData.mitra}</b></p>
                          </div>
                        )}
                      </div>

                      <h3 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                        Data Konfirmasi Pembayaran
                      </h3>
                      
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Nama Lengkap (Sesuai Rekening Pengirim)</label>
                        <input type="text" placeholder="Masukkan nama lengkap Anda" required value={invData.senderName} onChange={(e) => setInvData({...invData, senderName: e.target.value})} style={inputStyle} />
                      </div>
                      
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Nama Bank Pengirim</label>
                        <input type="text" placeholder="Misal: BCA, Mandiri, BNI, dll" required value={invData.senderBank} onChange={(e) => setInvData({...invData, senderBank: e.target.value})} style={inputStyle} />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Upload Bukti Transfer</label>
                        <input type="file" accept="image/*,application/pdf" required onChange={(e) => setInvData({...invData, proofFile: e.target.files[0]})} style={{ ...inputStyle, padding: '9px', background: '#ffffff', cursor: 'pointer' }} />
                      </div>

                      <div className={invShake ? styles.shakeRed : ''} style={{ marginBottom: '24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <input type="checkbox" checked={invAgreed} onChange={(e) => setInvAgreed(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#c45e20', marginTop: '2px' }} />
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '14px', cursor: 'pointer', color: invShake ? '#dc2626' : '#111827', fontWeight: 'bold' }} onClick={() => setInvAgreed(!invAgreed)}>
                              Saya menyetujui seluruh <u>Syarat, Ketentuan, dan Risiko Investasi</u>.
                            </label>
                            <button type="button" onClick={() => setShowTerms(!showTerms)} style={{ display: 'block', background: 'none', border: 'none', color: '#c45e20', fontSize: '13px', fontWeight: '700', marginTop: '6px', cursor: 'pointer', padding: 0 }}>
                              {showTerms ? 'Sembunyikan Detail ▲' : 'Baca Detail ▼'}
                            </button>
                          </div>
                        </div>

                        {showTerms && (
                          <div style={{ marginTop: '14px', padding: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#4b5563', maxHeight: '150px', overflowY: 'auto', lineHeight: '1.6' }}>
                            <p style={{ margin: '0 0 8px 0' }}><b>1. Risiko Fluktuasi Pasar:</b> Nilai investasi komoditas dapat berubah sewaktu-waktu tergantung pada kondisi pasar global.</p>
                            <p style={{ margin: '0 0 8px 0' }}><b>2. Regulasi Ekspor:</b> Proses distribusi dapat dipengaruhi oleh perubahan regulasi internasional maupun kendala logistik.</p>
                            <p style={{ margin: '0' }}><b>3. Kebijakan Dana:</b> Dana yang telah dikonfirmasi dan dialokasikan ke dalam kuota komoditas tidak dapat ditarik kembali secara sepihak.</p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setIsInvestingFlow(false)} style={{ padding: '14px 20px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          BATAL
                        </button>
                        <button type="submit" style={{ flex: 1, padding: '14px', background: '#c45e20', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,94,32,0.3)' }}>
                          SELESAI & KONFIRMASI PEMBAYARAN
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

// Styling Objek Inline
const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px'
};

const inputStyle = {
  width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827'
};

const qtyBtnStyle = {
  padding: '12px 18px', background: '#e2e8f0', border: 'none', fontSize: '18px', fontWeight: 'bold', color: '#334155', cursor: 'pointer', transition: 'background 0.2s'
};

const radioContainerStyle = {
  flex: 1, padding: '12px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#374151', transition: 'all 0.2s ease'
};

const menuItemStyle = {
  display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderRadius: '8px', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#4b5563', cursor: 'pointer', textAlign: 'left'
};

export default Invest;
