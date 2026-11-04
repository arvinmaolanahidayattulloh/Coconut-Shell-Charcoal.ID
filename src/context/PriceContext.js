"use client";

import { createContext, useContext, useState } from "react";

// [PATCH:PRICE-SAFE] nilai bawaan agar usePrice() tidak pernah undefined (aman saat prerender)
// livePrice = null sampai harga asli dari chart tiba. Tidak ada harga sementara.
const PriceContext = createContext({
  livePrice: null,
  setLivePrice: () => {},
});
// [/PATCH:PRICE-SAFE]

export function PriceProvider({ children }) {
  // null = harga belum termuat
  const [livePrice, setLivePrice] = useState(null);

  return (
    <PriceContext.Provider value={{ livePrice, setLivePrice }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  return useContext(PriceContext);
}
