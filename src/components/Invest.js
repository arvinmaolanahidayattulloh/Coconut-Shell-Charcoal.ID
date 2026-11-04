"use client";

import React, { useState } from 'react';

// Import sub-komponen dari folder invest
import InvestPageContent from './invest/invest.page';
import InvestProfileContent from './invest/invest.profile';

export default function Invest() {
  // State untuk mengontrol halaman mana yang sedang aktif
  const [activeTab, setActiveTab] = useState('invest');
  
  // State global untuk status investasi (agar portofolio tetap tersimpan saat pindah tab)
  const [invested, setInvested] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px' }}>
      
      {/* AREA KONTEN DINAMIS */}
      <main>
        {activeTab === 'invest' && (
          <InvestPageContent 
            invested={invested} 
            setInvested={setInvested} 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'profil' && (
          <InvestProfileContent 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>

      {/* NAVIGASI BAWAH (BOTTOM NAVIGATION) */}
      <div style={bottomNavStyle}>
        <button 
          onClick={() => setActiveTab('invest')} 
          style={{ ...navBtnStyle, color: activeTab === 'invest' ? '#c45e20' : '#64748b' }}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>🏠</span>
          Beranda
        </button>
        <button 
          onClick={() => setActiveTab('profil')} 
          style={{ ...navBtnStyle, color: activeTab === 'profil' ? '#c45e20' : '#64748b' }}
        >
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>👤</span>
          Profil
        </button>
      </div>

    </div>
  );
}

// Styling Navigasi Bawah
const bottomNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#ffffff',
  borderTop: '1px solid #e2e8f0',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '10px 0',
  boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
  zIndex: 100
};

const navBtnStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1
};
