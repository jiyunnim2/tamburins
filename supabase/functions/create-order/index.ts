// POST /functions/v1/create-order
// Body: { lines: [{ productId, option, qty }], shipping: { recipient_name, phone, address, address_detail, request } }
// Re-prices the cart from CATALOG, validates shipping, attaches the caller
// (if signed in) and inserts the order with the service role.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CATALOG, SHIPPING_FEE, SHIPPING_FREE_OVER } from './catalog.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: { lines?: unknown; shipping?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  // ----- lines -----
  if (!Array.isArray(payload.lines) || payload.lines.length === 0 || payload.lines.length > 20) {
    return json({ error: '장바구니가 비어 있습니다.' }, 400);
  }
  const items = [];
  for (const raw of payload.lines as Array<Record<string, unknown>>) {
    const product = CATALOG[String(raw.productId)];
    const option = product?.options[String(raw.option)];
    const qty = Number(raw.qty);
    if (!product || !option || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return json({ error: '판매하지 않는 상품이 포함되어 있습니다.' }, 400);
    }
    items.push({
      productId: String(raw.productId), name: product.name, notes: product.notes, option: String(raw.option),
      qty, price: option.price, image: option.image, lineTotal: option.price * qty, points: option.points * qty,
    });
  }
  const perfumes = items.filter((i) => i.productId !== 'shopping-bag-s').reduce((n, i) => n + i.qty, 0);
  const bags = items.filter((i) => i.productId === 'shopping-bag-s').reduce((n, i) => n + i.qty, 0);
  if (bags > Math.max(perfumes, 1)) return json({ error: '쇼핑백은 제품 개수만큼 구매하실 수 있습니다.' }, 400);

  // ----- shipping -----
  const s = payload.shipping ?? {};
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const shipping = {
    recipient_name: str(s.recipient_name, 40),
    phone: str(s.phone, 11),
    address: str(s.address, 200),
    address_detail: str(s.address_detail, 200),
    request: str(s.request, 100) || null,
  };
  if (!shipping.recipient_name || !/^01\d{8,9}$/.test(shipping.phone) || !shipping.address || !shipping.address_detail) {
    return json({ error: '배송 정보를 다시 확인해 주세요.' }, 400);
  }

  // ----- totals -----
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const shipping_fee = subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping_fee;
  const points = items.reduce((n, i) => n + i.points, 0);

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // caller (optional — guests can order too)
  let userId: string | null = null;
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token && token !== Deno.env.get('SUPABASE_ANON_KEY')) {
    const { data } = await admin.auth.getUser(token);
    userId = data.user?.id ?? null;
  }

  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const order_no = `TB${ymd}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      order_no, user_id: userId, channel: 'online', status: '온라인 구매 완료',
      items: items.map(({ lineTotal: _l, points: _p, ...rest }) => rest),
      subtotal, shipping_fee, total, points, ...shipping,
    })
    .select()
    .single();

  if (error) {
    console.error('insert failed', error);
    return json({ error: '주문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 500);
  }
  return json({ order });
});
