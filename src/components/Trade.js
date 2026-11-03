"use client";

import { useState } from "react";
import { useAccount } from "@/components/Account"; // Menyesuaikan dengan sistem akun Anda

export default function Trade() {
  const { user } = useAccount(); // Mengambil data user yang sedang login
  const [amount, setAmount] = useState(1);
  const [activeTab, setActiveTab] = useState("market"); // market / positions
  const [positions, setPositions] = useState([]);
  const [notification, setNotification] = useState(null);

  // Simulasi harga pasar terkini untuk komoditas arang / TON
  const currentMarketPrice = 1250.50; 

  const handleAmountChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100; // Maksimal 100 TON
    if (val < 1) val = 1;
    setAmount(val);
  };

  const executeOrder = (type) => {
    if (!user) {
      alert("Silakan Login terlebih dahulu untuk melakukan transaksi!");
      return;
    }

    const newPosition = {
      id: Date.now(),
      type: type, // "BUY" atau "SELL"
      amount: amount,
      price: currentMarketPrice,
      time: new Date().toLocaleTimeString(),
    };

    setPositions([newPosition, ...positions]);
    setNotification(`Berhasil Eksekusi ${type} ${amount} TON di harga $${currentMarketPrice}`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <section id="trade" className="py-12 bg-gray-950 text-white px-4 md:px-8 border-t border-gray-800">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        
        {/* Header MT5 Style */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="font-bold text-lg tracking-wider text-amber-500">MT5 TERMINAL // CHARCOAL X</h2>
            <p className="text-xs text-gray-400">Pair: TON / USD | Live Execution</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-emerald-900/60 text-emerald-400 px-2 py-1 rounded font-mono border border-emerald-700">
              ASK: ${currentMarketPrice}
            </span>
          </div>
        </div>

        {/* Notifikasi Transaksi */}
        {notification && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 text-center font-medium animate-pulse">
            {notification}
          </div>
        )}

        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Panel Kontrol Order (Kiri) */}
          <div className="md:col-span-1 space-y-4 bg-gray-950 p-4 rounded-lg border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Order Panel</h3>
            
            {/* Input Volume */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Volume (TON) - Maks 100</label>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                  className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm font-bold"
                >-</button>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={amount} 
                  onChange={handleAmountChange}
                  className="w-full bg-gray-900 border border-gray-700 text-center rounded py-1 text-white font-mono"
                />
                <button 
                  onClick={() => setAmount(Math.min(100, amount + 1))}
                  className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm font-bold"
                >+</button>
              </div>
            </div>

            {/* Tombol Jual & Beli ala MT5 */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => executeOrder("SELL")}
                className="bg-rose-600 hover:bg-rose-700 transition active:scale-95 text-white py-3 rounded font-bold flex flex-col items-center shadow-lg"
              >
                <span className="text-xs uppercase tracking-wide opacity-80">Sell (Jual)</span>
                <span className="text-sm font-mono">${(currentMarketPrice - 0.20).toFixed(2)}</span>
              </button>

              <button 
                onClick={() => executeOrder("BUY")}
                className="bg-blue-600 hover:bg-blue-700 transition active:scale-95 text-white py-3 rounded font-bold flex flex-col items-center shadow-lg"
              >
                <span className="text-xs uppercase tracking-wide opacity-80">Buy (Beli)</span>
                <span className="text-sm font-mono">${(currentMarketPrice + 0.20).toFixed(2)}</span>
              </button>
            </div>

            {!user && (
              <p className="text-xs text-amber-400/90 text-center pt-2">
                * Anda harus login Google terlebih dahulu untuk mengeksekusi order.
              </p>
            )}
          </div>

          {/* Panel Informasi Posisi / History Open Price (Kanan) */}
          <div className="md:col-span-2 bg-gray-950 p-4 rounded-lg border border-gray-800 flex flex-col">
            <div className="flex border-b border-gray-800 pb-2 mb-3">
              <button 
                onClick={() => setActiveTab("market")}
                className={`text-xs font-bold px-3 py-1 rounded mr-2 ${activeTab === 'market' ? 'bg-gray-800 text-amber-400' : 'text-gray-400'}`}
              >
                Posisi Aktif ({positions.length})
              </button>
            </div>

            <div className="flex-grow overflow-y-auto max-h-60 space-y-2">
              {positions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-10 text-xs">
                  <p>Belum ada posisi terbuka.</p>
                  <p>Lakukan Buy atau Sell untuk melihat harga eksekusi.</p>
                </div>
              ) : (
                positions.map((pos) => (
                  <div key={pos.id} className="bg-gray-900 border border-gray-800 p-3 rounded flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className={`font-bold px-1.5 py-0.5 rounded mr-2 ${pos.type === 'BUY' ? 'bg-blue-900 text-blue-300' : 'bg-rose-900 text-rose-300'}`}>
                        {pos.type}
                      </span>
                      <span className="text-gray-300">{pos.amount} TON</span>
                      <span className="text-gray-500 ml-2">({pos.time})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-[10px]">Harga Beli (Open):</div>
                      <div className="text-emerald-400 font-bold">${pos.price}</div>
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
