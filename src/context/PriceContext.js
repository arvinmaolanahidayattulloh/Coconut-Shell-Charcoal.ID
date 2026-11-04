"use client";

import { createContext, useContext, useState } from "react";

// [PATCH:PRICE-SAFE] nilai bawaan agar usePrice() tidak pernah undefined (aman saat prerender)
// livePrice dan index = null sampai harga asli dari chart tiba. Tidak ada harga sementara.
//
// index = { usd, idr } -> harga CSC per TON (tidak ikut mata uang, mode, atau 40ft di tampilan chart).
//   usd : dari rumus CSC dengan harga pasar asli
//   idr : usd x kurs IDR asli dari /api/prices
const PriceContext = createContext({
  livePrice: null,
  setLivePrice: () => {},
  index: null,
  setIndex: () => {},
});
// [/PATCH:PRICE-SAFE]

export function PriceProvider({ children }) {
  // null = harga belum termuat
  const [livePrice, setLivePrice] = useState(null);
  const [index, setIndex] = useState(null);

  return (
    <PriceContext.Provider value={{ livePrice, setLivePrice, index, setIndex }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  return useContext(PriceContext);
}
