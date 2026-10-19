// Server-side price list — the source of truth for order totals.
// Mirrors PRODUCTS in js/store.js (the browser copy is display-only).
export const CATALOG: Record<string, { name: string; notes: string; options: Record<string, { price: number; points: number; image: string }> }> = {
  'perfume-blue-hinoki': {
    name: '퍼퓸 블루히노키',
    notes: '상쾌한 파인오일  |  푸른 히노키  |  드리프트우드',
    options: {
      '11ml': { price: 45000, points: 1000, image: 'assets/images/item-perfume-11ml.png' },
      '14ml': { price: 56000, points: 1200, image: 'assets/images/item-perfume-11ml.png' },
      '50ml': { price: 165000, points: 3500, image: 'assets/images/item-perfume-50ml.png' },
    },
  },
  'shopping-bag-s': {
    name: '쇼핑백 (S)',
    notes: '쇼핑백 추가',
    options: { 'Small Size': { price: 1000, points: 0, image: 'assets/images/item-shopping-bag.png' } },
  },
};

export const SHIPPING_FREE_OVER = 30000;
export const SHIPPING_FEE = 3000;
