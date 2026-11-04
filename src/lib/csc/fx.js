// [CSC:FX] kurs CNY & JPY ke USD. Utama: Google Finance (scrape). Cadangan: Frankfurter (ECB).
// Hasil: { cny, jpy, source } dalam USD per 1 unit.
const UA = "Mozilla/5.0 (compatible; CSCID/1.0)";

// [CSC:FX-GOOGLE] ambil "USD-XXX" -> XXX per 1 USD, lalu dibalik jadi USD per 1 XXX
async function googleRate(code) {
  const res = await fetch(`https://www.google.com/finance/quote/USD-${code}?hl=en`, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("google " + res.status);
  const html = await res.text();
  const m = html.match(/data-last-price="([\d.]+)"/);
  if (!m) throw new Error("google: angka tidak ditemukan");
  const v = parseFloat(m[1]);
  if (!isFinite(v) || v <= 0) throw new Error("google: angka tidak valid");
  return 1 / v;
}
// [/CSC:FX-GOOGLE]

// [CSC:FX-ECB] cadangan resmi harian
async function ecbRate(code) {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${code}&symbols=USD`, { cache: "no-store" });
  if (!res.ok) throw new Error("frankfurter " + res.status);
  const j = await res.json();
  const v = j?.rates?.USD;
  if (!isFinite(v) || v <= 0) throw new Error("frankfurter: angka tidak valid");
  return v;
}
// [/CSC:FX-ECB]

async function one(code) {
  try { return { v: await googleRate(code), src: "google" }; }
  catch (e) { return { v: await ecbRate(code), src: "ecb" }; }
}

export async function fetchFx() {
  const [c, j] = await Promise.all([one("CNY"), one("JPY")]);
  return { cny: c.v, jpy: j.v, source: c.src === j.src ? c.src : "mixed" };
}
// [/CSC:FX]
