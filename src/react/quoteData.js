/* ── Shared quotation data ──────────────────────────────────────── */

/* WhatsApp business number — REPLACE with your real number (no +, no spaces) */
export const WHATSAPP_NUMBER = '919910809899'
export function whatsappLink (text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/* Three ready-made quotation packages */
export const QUOTE_PACKAGES = [
  {
    id: 'essential', name: 'Essential Refresh', tag: 'E-Design',
    price: '₹25,000 – ₹75,000',
    points: ['Mood board & layout plan', 'Curated shopping list with links', '2 design revisions', 'Delivered in ~2 weeks'],
  },
  {
    id: 'signature', name: 'Signature Design', tag: 'Most Popular', popular: true,
    price: '₹1,50,000 – ₹4,00,000',
    points: ['Everything in Essential', 'Photorealistic 3D renders', 'Procurement & delivery', 'On-site styling & reveal'],
  },
  {
    id: 'luxury', name: 'Luxury Full-Service', tag: 'Bespoke',
    price: '₹5,00,000+',
    points: ['Bespoke joinery & furniture', 'End-to-end project management', 'Dedicated design lead', 'White-glove installation'],
  },
]

/* "What we deliver" — shown on the quotation page */
export const DELIVERABLES = [
  { title: 'Discovery Call', desc: 'We understand your lifestyle, taste, budget and timeline — no templates.', icon: 'M10 2a8 8 0 100 16 8 8 0 000-16zm0 4v4l3 2' },
  { title: 'Mood Board', desc: 'A curated palette of colours, materials and references so you see the direction first.', icon: 'M3 4h14v12H3zM3 8h14M8 8v8' },
  { title: 'Concept & 3D Visuals', desc: 'Photorealistic renders of your actual room — approve every detail before anything is ordered.', icon: 'M3 6l7-3 7 3v8l-7 3-7-3zM10 3v15M3 6l7 3 7-3' },
  { title: 'Curated Shopping List', desc: 'Every piece linked to a real product with live India pricing — buy exactly what you see.', icon: 'M4 6h12l-1 9H5zM7 6V4h6v2' },
  { title: 'Procurement & Delivery', desc: 'We order, track and deliver everything — from sofas to bespoke joinery — to your door.', icon: 'M2 7h11v7H2zM13 9h3l2 2v3h-5M5 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { title: 'Style & Reveal', desc: 'On reveal day we place, style and finish every cushion and candle — ready to live in.', icon: 'M10 2l2.4 5 5.6.5-4.2 3.7 1.3 5.3L10 14.8 4.9 17.5l1.3-5.3L2 8.5 7.6 8z' },
]
