// [FILE: src/lib/investCalc.js] Kalkulasi tagihan Invest. Aturan TETAP: harga = indeks CSCID × 0,90.
// [SECTION:FACTOR] ubah hanya di sini bila aturan berubah
export const INVEST_PRICE_FACTOR = 0.90;
// [/SECTION:FACTOR]

// [SECTION:CALC]
export function hitungInvest(index, ton, currency) {
  const priceReady = !!index && index.usd > 0 && index.idr > 0;
  const unitUSD = priceReady ? index.usd * INVEST_PRICE_FACTOR : 0;
  const unitIDR = priceReady ? index.idr * INVEST_PRICE_FACTOR : 0;
  const total = currency === "IDR" ? ton * unitIDR : ton * unitUSD;
  const display = !priceReady
    ? "Memuat harga..."
    : currency === "IDR"
      ? `Rp ${Math.round(total).toLocaleString("id-ID")}`
      : `$ ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return { priceReady, unitUSD, unitIDR, total, display };
}
// [/SECTION:CALC]
