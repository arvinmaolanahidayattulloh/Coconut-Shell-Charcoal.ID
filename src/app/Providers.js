"use client";

import { AccountProvider } from "@/components/Account";
import { PriceProvider } from "@/context/PriceContext";

export default function Providers({ children }) {
  return (
    <AccountProvider>
      <PriceProvider>{children}</PriceProvider>
    </AccountProvider>
  );
}
