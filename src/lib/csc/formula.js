
// [CSC:FORMULA] satu sumber kebenaran rumus indeks CSC (basis USD per TON)
// Naikkan FORMULA_VERSION setiap rumus/konstanta berubah, lalu hitung ulang histori.
export const FORMULA_VERSION = 1;

export const OZ = 31.1034768;
export const GRAMS = 5;
export const BTC_FACTOR = 0.005;
export const YUAN_BASE = 5000;
export const USD_BASE = 500;
export const JPY_BASE = 50000;
export const SAR_BASE = 5000;
export const EUR_DIV = 1.08; // EURUSDT dibagi ini = komponen "USD"

// [PATCH:FX-REAL] kurs diberikan dari luar (data asli), bukan konstanta
export const SAR_PEG = 1 / 3.75; // patok resmi SAMA sejak 1986

// fx = EURUSDT / EUR_DIV, au = PAXGUSDT, bt = BTCUSDT
// rates = { cny, jpy } dalam USD per 1 unit
export function cscCalc(fx, au, bt, rates) {
  const mUsd = USD_BASE;
  const mYuan = YUAN_BASE * rates.cny;
  const mJpy = JPY_BASE * rates.jpy;
  const mSar = SAR_BASE * SAR_PEG;
  const mGold = GRAMS / OZ;
  const mBtc = BTC_FACTOR;
  return (fx * mUsd + fx * mYuan + fx * mJpy + fx * mSar + au * mGold + bt * mBtc) / 6;
}
// [/PATCH:FX-REAL]

// Interval yang disimpan di server
export const INTERVALS = ["1m", "5m", "15m", "30m", "1h", "4h", "12h", "1d", "3d", "1w", "1M"];
// [/CSC:FORMULA]
