"use client";

import { createContext, useContext, useState } from "react";

// [PATCH:PRICE-SAFE] nilai bawaan agar usePrice() tidak pernah undefined (aman saat prerender)
const PriceContext = createContext({
  livePrice: 1250.50,
  setLivePrice: () => {},
});
// [/PATCH:PRICE-SAFE]

export function PriceProvider({ children }) {
  // Nilai default awal saat chart belum termuat
  const [livePrice, setLivePrice] = useState(1250.50);

  return (
    <PriceContext.Provider value={{ livePrice, setLivePrice }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  return useContext(PriceContext);
}
