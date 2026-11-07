import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { sql } from "@/lib/csc/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "cscid_demo_session";
const IPO_PRICE_CENTS = 100000; // USD 1,000.00 per share
const TOTAL_IPO_SHARES = 10000;
const json = (body, status = 200) => NextResponse.json(body, { status });
const hashToken = (value) => createHash("sha256").update(value).digest("hex");

async function ensureMarketSchema() {
  await sql`ALTER TABLE cscid_demo_users
    ADD COLUMN IF NOT EXISTS locked_balance_cents bigint NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cscid_demo_users
    ADD COLUMN IF NOT EXISTS locked_shares bigint NOT NULL DEFAULT 0`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_market_state (
    id integer PRIMARY KEY CHECK (id = 1),
    ipo_remaining_shares bigint NOT NULL DEFAULT 10000,
    last_price_cents bigint NOT NULL DEFAULT 100000,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`INSERT INTO cscid_demo_market_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_orders (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES cscid_demo_users(id),
    side text NOT NULL CHECK (side IN ('BUY','SELL')),
    price_cents bigint NOT NULL CHECK (price_cents > 0),
    quantity bigint NOT NULL CHECK (quantity > 0),
    remaining bigint NOT NULL CHECK (remaining >= 0),
    status text NOT NULL CHECK (status IN ('OPEN','PARTIAL','FILLED','CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS cscid_demo_orders_book_idx
    ON cscid_demo_orders (side, status, price_cents, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS cscid_demo_orders_user_idx
    ON cscid_demo_orders (user_id, status, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS cscid_demo_trades (
    id bigserial PRIMARY KEY,
    buy_order_id text NOT NULL,
    sell_order_id text,
    buyer_id text NOT NULL REFERENCES cscid_demo_users(id),
    seller_id text REFERENCES cscid_demo_users(id),
    price_cents bigint NOT NULL,
    quantity bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS cscid_demo_trades_time_idx
    ON cscid_demo_trades (created_at DESC)`;

  await sql`CREATE OR REPLACE FUNCTION cscid_demo_place_order(
    p_user_id text, p_order_id text, p_side text, p_price bigint, p_qty bigint
  ) RETURNS jsonb LANGUAGE plpgsql AS $$
  DECLARE
    v_market cscid_demo_market_state%ROWTYPE;
    v_order cscid_demo_orders%ROWTYPE;
    v_counter cscid_demo_orders%ROWTYPE;
    v_qty bigint;
    v_trade_price bigint;
    v_buy_id text;
    v_sell_id text;
    v_buyer text;
    v_seller text;
    v_remaining bigint;
  BEGIN
    -- One market-row lock serializes all matching and settlement operations.
    SELECT * INTO v_market FROM cscid_demo_market_state WHERE id=1 FOR UPDATE;
    PERFORM 1 FROM cscid_demo_users WHERE id=p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'USER_NOT_FOUND'; END IF;
    IF p_side='BUY' THEN
      UPDATE cscid_demo_users SET balance_cents=balance_cents-(p_price*p_qty),
        locked_balance_cents=locked_balance_cents+(p_price*p_qty)
        WHERE id=p_user_id AND balance_cents>=p_price*p_qty;
      IF NOT FOUND THEN RAISE EXCEPTION 'INSUFFICIENT_CASH'; END IF;
    ELSIF p_side='SELL' THEN
      UPDATE cscid_demo_users SET locked_shares=locked_shares+p_qty
        WHERE id=p_user_id AND shares-locked_shares>=p_qty;
      IF NOT FOUND THEN RAISE EXCEPTION 'INSUFFICIENT_SHARES'; END IF;
    ELSE
      RAISE EXCEPTION 'INVALID_SIDE';
    END IF;
    INSERT INTO cscid_demo_orders(id,user_id,side,price_cents,quantity,remaining,status)
      VALUES(p_order_id,p_user_id,p_side,p_price,p_qty,p_qty,'OPEN');
    SELECT * INTO v_order FROM cscid_demo_orders WHERE id=p_order_id FOR UPDATE;

    IF v_order.side='BUY' THEN
      LOOP
        SELECT * INTO v_counter FROM cscid_demo_orders
          WHERE side='SELL' AND status IN ('OPEN','PARTIAL') AND remaining>0
            AND price_cents<=v_order.price_cents AND user_id<>p_user_id
            AND (v_market.ipo_remaining_shares=0 OR price_cents<100000)
          ORDER BY price_cents ASC, created_at ASC, id ASC
          LIMIT 1 FOR UPDATE SKIP LOCKED;
        IF FOUND THEN
          v_qty := LEAST(v_order.remaining, v_counter.remaining);
          v_trade_price := v_counter.price_cents;
          v_buy_id := v_order.id; v_sell_id := v_counter.id;
          v_buyer := v_order.user_id; v_seller := v_counter.user_id;
          UPDATE cscid_demo_users SET
            locked_balance_cents=locked_balance_cents-(v_order.price_cents*v_qty),
            balance_cents=balance_cents+((v_order.price_cents-v_trade_price)*v_qty),
            shares=shares+v_qty
            WHERE id=v_buyer;
          UPDATE cscid_demo_users SET
            locked_shares=locked_shares-v_qty,
            balance_cents=balance_cents+(v_trade_price*v_qty),
            shares=shares-v_qty
            WHERE id=v_seller;
          INSERT INTO cscid_demo_trades(buy_order_id,sell_order_id,buyer_id,seller_id,price_cents,quantity)
            VALUES(v_buy_id,v_sell_id,v_buyer,v_seller,v_trade_price,v_qty);
          UPDATE cscid_demo_orders SET remaining=remaining-v_qty,
            status=CASE WHEN remaining-v_qty=0 THEN 'FILLED' ELSE 'PARTIAL' END, updated_at=now()
            WHERE id=v_counter.id RETURNING * INTO v_counter;
          UPDATE cscid_demo_orders SET remaining=remaining-v_qty,
            status=CASE WHEN remaining-v_qty=0 THEN 'FILLED' ELSE 'PARTIAL' END, updated_at=now()
            WHERE id=v_order.id RETURNING * INTO v_order;
        ELSIF v_market.ipo_remaining_shares>0 AND p_price>=100000 THEN
          v_qty := LEAST(v_order.remaining,v_market.ipo_remaining_shares);
          v_trade_price := 100000;
          UPDATE cscid_demo_users SET
            locked_balance_cents=locked_balance_cents-(v_order.price_cents*v_qty),
            balance_cents=balance_cents+((v_order.price_cents-v_trade_price)*v_qty),
            shares=shares+v_qty
            WHERE id=p_user_id;
          INSERT INTO cscid_demo_trades(buy_order_id,sell_order_id,buyer_id,seller_id,price_cents,quantity)
            VALUES(v_order.id,'IPO',p_user_id,NULL,v_trade_price,v_qty);
          UPDATE cscid_demo_market_state SET ipo_remaining_shares=ipo_remaining_shares-v_qty,
            last_price_cents=v_trade_price, updated_at=now() WHERE id=1 RETURNING * INTO v_market;
          UPDATE cscid_demo_orders SET remaining=remaining-v_qty,
            status=CASE WHEN remaining-v_qty=0 THEN 'FILLED' ELSE 'PARTIAL' END, updated_at=now()
            WHERE id=v_order.id RETURNING * INTO v_order;
        ELSE
          EXIT;
        END IF;
        UPDATE cscid_demo_market_state SET last_price_cents=v_trade_price,updated_at=now() WHERE id=1;
        IF v_order.remaining=0 THEN EXIT; END IF;
      END LOOP;
    ELSE
      LOOP
        SELECT * INTO v_counter FROM cscid_demo_orders
          WHERE side='BUY' AND status IN ('OPEN','PARTIAL') AND remaining>0
            AND price_cents>=v_order.price_cents AND user_id<>p_user_id
            AND (v_market.ipo_remaining_shares=0 OR v_order.price_cents<100000)
          ORDER BY price_cents DESC, created_at ASC, id ASC
          LIMIT 1 FOR UPDATE SKIP LOCKED;
        IF NOT FOUND THEN EXIT; END IF;
        v_qty := LEAST(v_order.remaining,v_counter.remaining);
        v_trade_price := v_counter.price_cents;
        v_buy_id := v_counter.id; v_sell_id := v_order.id;
        v_buyer := v_counter.user_id; v_seller := v_order.user_id;
        UPDATE cscid_demo_users SET
          locked_balance_cents=locked_balance_cents-(v_counter.price_cents*v_qty),
          balance_cents=balance_cents+((v_counter.price_cents-v_trade_price)*v_qty),
          shares=shares+v_qty
          WHERE id=v_buyer;
        UPDATE cscid_demo_users SET
          locked_shares=locked_shares-v_qty,
          balance_cents=balance_cents+(v_trade_price*v_qty),
          shares=shares-v_qty
          WHERE id=v_seller;
        INSERT INTO cscid_demo_trades(buy_order_id,sell_order_id,buyer_id,seller_id,price_cents,quantity)
          VALUES(v_buy_id,v_sell_id,v_buyer,v_seller,v_trade_price,v_qty);
        UPDATE cscid_demo_orders SET remaining=remaining-v_qty,
          status=CASE WHEN remaining-v_qty=0 THEN 'FILLED' ELSE 'PARTIAL' END, updated_at=now()
          WHERE id=v_counter.id RETURNING * INTO v_counter;
        UPDATE cscid_demo_orders SET remaining=remaining-v_qty,
          status=CASE WHEN remaining-v_qty=0 THEN 'FILLED' ELSE 'PARTIAL' END, updated_at=now()
          WHERE id=v_order.id RETURNING * INTO v_order;
        UPDATE cscid_demo_market_state SET last_price_cents=v_trade_price,updated_at=now() WHERE id=1;
        IF v_order.remaining=0 THEN EXIT; END IF;
      END LOOP;
    END IF;
    SELECT remaining INTO v_remaining FROM cscid_demo_orders WHERE id=p_order_id;
    RETURN jsonb_build_object('orderId',p_order_id,'remaining',v_remaining,
      'status',(SELECT status FROM cscid_demo_orders WHERE id=p_order_id));
  END $$`;

  await sql`CREATE OR REPLACE FUNCTION cscid_demo_cancel_order(p_user_id text,p_order_id text)
    RETURNS jsonb LANGUAGE plpgsql AS $$
    DECLARE v_order cscid_demo_orders%ROWTYPE;
    BEGIN
      PERFORM 1 FROM cscid_demo_market_state WHERE id=1 FOR UPDATE;
      SELECT * INTO v_order FROM cscid_demo_orders
        WHERE id=p_order_id AND user_id=p_user_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
      IF v_order.status NOT IN ('OPEN','PARTIAL') OR v_order.remaining=0 THEN
        RAISE EXCEPTION 'ORDER_NOT_OPEN';
      END IF;
      IF v_order.side='BUY' THEN
        UPDATE cscid_demo_users SET
          locked_balance_cents=locked_balance_cents-(v_order.price_cents*v_order.remaining),
          balance_cents=balance_cents+(v_order.price_cents*v_order.remaining)
          WHERE id=p_user_id;
      ELSE
        UPDATE cscid_demo_users SET locked_shares=locked_shares-v_order.remaining
          WHERE id=p_user_id;
      END IF;
      UPDATE cscid_demo_orders SET status='CANCELLED',remaining=0,updated_at=now()
        WHERE id=p_order_id;
      RETURN jsonb_build_object('orderId',p_order_id,'status','CANCELLED');
    END $$`;
}

async function getUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await sql`SELECT u.id,u.username,u.balance_cents,u.locked_balance_cents,
      u.shares,u.locked_shares
    FROM cscid_demo_sessions s JOIN cscid_demo_users u ON u.id=s.user_id
    WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() LIMIT 1`;
  return rows[0] || null;
}

export async function GET() {
  try {
    await ensureMarketSchema();
    const user = await getUser();
    if (!user) return json({ error: "Login Demo diperlukan." }, 401);
    const [market, bids, asks, trades, orders] = await Promise.all([
      sql`SELECT ipo_remaining_shares,last_price_cents,updated_at FROM cscid_demo_market_state WHERE id=1`,
      sql`SELECT price_cents,SUM(remaining)::bigint AS quantity,COUNT(*)::int AS order_count
        FROM cscid_demo_orders WHERE side='BUY' AND status IN ('OPEN','PARTIAL') AND remaining>0
        GROUP BY price_cents ORDER BY price_cents DESC LIMIT 15`,
      sql`SELECT price_cents,SUM(remaining)::bigint AS quantity,COUNT(*)::int AS order_count
        FROM cscid_demo_orders WHERE side='SELL' AND status IN ('OPEN','PARTIAL') AND remaining>0
        GROUP BY price_cents ORDER BY price_cents ASC LIMIT 15`,
      sql`SELECT t.id,t.price_cents,t.quantity,t.created_at,b.username AS buyer,s.username AS seller
        FROM cscid_demo_trades t
        JOIN cscid_demo_users b ON b.id=t.buyer_id
        LEFT JOIN cscid_demo_users s ON s.id=t.seller_id
        ORDER BY t.created_at DESC,t.id DESC LIMIT 30`,
      sql`SELECT id,side,price_cents,quantity,remaining,status,created_at
        FROM cscid_demo_orders WHERE user_id=${user.id}
        ORDER BY created_at DESC LIMIT 50`,
    ]);
    const m = market[0];
    return json({
      market: { symbol:"CSCID", currency:"USD", ipoPriceCents:IPO_PRICE_CENTS,
        ipoTotalShares:TOTAL_IPO_SHARES, ipoRemainingShares:Number(m.ipo_remaining_shares),
        ipoSoldShares:TOTAL_IPO_SHARES-Number(m.ipo_remaining_shares),
        lastPriceCents:Number(m.last_price_cents), updatedAt:m.updated_at },
      account: { id:user.id, username:user.username, balanceCents:Number(user.balance_cents),
        lockedBalanceCents:Number(user.locked_balance_cents), shares:Number(user.shares),
        lockedShares:Number(user.locked_shares) },
      bids:bids.map(x=>({...x,priceCents:Number(x.price_cents),quantity:Number(x.quantity)})),
      asks:[{priceCents:IPO_PRICE_CENTS,quantity:Number(m.ipo_remaining_shares),orderCount:1,source:"IPO"},...asks.map(x=>({...x,priceCents:Number(x.price_cents),quantity:Number(x.quantity)}))].sort((a,b)=>a.priceCents-b.priceCents).slice(0,15),
      trades:trades.map(x=>({id:Number(x.id),priceCents:Number(x.price_cents),quantity:Number(x.quantity),createdAt:x.created_at,buyer:x.buyer,seller:x.seller||"IPO"})),
      orders:orders.map(x=>({id:x.id,side:x.side,priceCents:Number(x.price_cents),quantity:Number(x.quantity),remaining:Number(x.remaining),status:x.status,createdAt:x.created_at}))
    });
  } catch (e) {
    console.error("[CSCID_MARKET_GET]",e);
    return json({error:"Data pasar belum dapat dimuat."},503);
  }
}

export async function POST(req) {
  try {
    await ensureMarketSchema();
    const user = await getUser();
    if (!user) return json({error:"Login Demo diperlukan."},401);
    const body = await req.json();
    const side = String(body?.side||"").toUpperCase();
    const price = Number(body?.price);
    const quantity = Number(body?.quantity);
    if (!["BUY","SELL"].includes(side)) return json({error:"Jenis order tidak valid."},400);
    if (!Number.isFinite(price)||price<=0||price>10000000||Math.round(price*100)!==price*100) return json({error:"Harga harus valid dengan maksimal 2 angka desimal."},400);
    if (!Number.isSafeInteger(quantity)||quantity<1||quantity>10000||quantity%10!==0) return json({error:"Jumlah minimal 10 lembar dan kelipatan 10."},400);
    const priceCents = Math.round(price*100);
    const orderId = randomUUID();

    // Reserve funds/shares, create the order, match and settle in one PostgreSQL function transaction.
    const result = await sql`SELECT cscid_demo_place_order(${user.id},${orderId},${side},${priceCents},${quantity}) AS result`;
    return json({ok:true,...result[0].result},201);
  } catch (e) {
    console.error("[CSCID_MARKET_POST]",e);
    return json({error:"Order gagal diproses. Silakan muat ulang pasar dan coba lagi."},503);
  }
}

export async function DELETE(req) {
  try {
    await ensureMarketSchema();
    const user = await getUser();
    if (!user) return json({error:"Login Demo diperlukan."},401);
    const {searchParams}=new URL(req.url);
    const id=searchParams.get("id");
    if (!id) return json({error:"ID order wajib diisi."},400);
    const rows=await sql`SELECT cscid_demo_cancel_order(${user.id},${id}) AS result`;
    return json({ok:true,...rows[0].result});
  } catch(e) {
    console.error("[CSCID_MARKET_DELETE]",e);
    return json({error:"Order tidak dapat dibatalkan. Periksa status order."},409);
  }
}
