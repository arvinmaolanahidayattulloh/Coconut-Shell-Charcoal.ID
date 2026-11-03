"use client";

import { createContext, useContext, useState } from "react";

const PriceContext = createContext();

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
