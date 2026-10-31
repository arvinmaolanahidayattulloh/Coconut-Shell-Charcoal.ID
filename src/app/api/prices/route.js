export async function GET() {
  try {
    const [goldRes, ratesRes] = await Promise.all([
      fetch("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD", {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0" },
      }),
      fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        cache: "no-store",
      }),
    ]);

    let xauusd = null;
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      const spread = goldData[0].spreadProfilePrices[0];
      xauusd = { bid: spread.bid, ask: spread.ask, mid: (spread.bid + spread.ask) / 2 };
    }

    let rates = null;
    if (ratesRes.ok) {
      const ratesData = await ratesRes.json();
      rates = ratesData.rates;
    }

    return Response.json({ xauusd, rates, timestamp: Date.now() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

