/**
 * TrendLens seed script — deterministic, template-driven marketplace data.
 * Run: bun prisma/seed.ts
 *
 * Seeds 12 products across 8 fashion categories. Each product gets:
 *  - 4 marketplace listings (Daraz, Amazon, AliExpress, Instagram/TikTok)
 *  - 12 weeks of price history (primary currency)
 *  - 12 weeks of search-interest trend points
 *  - 20-30 programmatically generated reviews (incl. fake-review patterns
 *    on 3 products so the Fake Review Radar has interesting findings)
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/* ------------------------------ Deterministic RNG ------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------- Pools ---------------------------------- */

const AUTHORS = [
  "Ayesha K.", "Hamza R.", "Sarah M.", "Bilal A.", "Fatima N.", "David L.",
  "Emma W.", "Usman T.", "Zainab S.", "Omar Q.", "Areeba H.", "James P.",
  "Sophie T.", "Ali R.", "Hira M.", "Daniel K.", "Maryam Z.", "Noor F.",
  "Ahmed S.", "Lisa G.", "Zoya A.", "Michael B.", "Kiran S.", "Hassan J.",
  "Olivia C.", "Talha N.", "Mehwish D.", "Chris E.", "Sana V.", "Faisal W.",
  "Rachel Y.", "Adnan Q.", "Priya M.", "Bilawal H.", "Grace O.", "Tariq F.",
];

const MARKETPLACES = ["DARAZ", "AMAZON", "ALIEXPRESS", "INSTAGRAM"] as const;
const MP_WEIGHTS = [0.36, 0.24, 0.2, 0.2];

type Tier = 1 | 2 | 3 | 4 | 5;

const TITLES: Record<Tier, string[]> = {
  5: ["Exactly as described", "Worth every rupee", "Superb quality", "My new favorite", "Highly recommended", "Beautiful piece", "Exceeded expectations", "Fantastic buy"],
  4: ["Very good, minor gripes", "Good value for money", "Happy with it", "Almost perfect", "Solid choice", "Good, not flawless"],
  3: ["It's okay", "Average at best", "Decent but overhyped", "Mixed feelings", "Does the job", "Expected more"],
  2: ["Disappointed", "Not worth it", "Below expectations", "Quality issues", "Wouldn't buy again"],
  1: ["Terrible quality", "Complete waste", "Avoid this seller", "Returning it", "Nothing like the photos"],
};

const BODIES: Record<Tier, string[]> = {
  5: [
    "Genuinely impressed with this {cat}. The material feels premium and the stitching is clean all around. Delivery arrived two days early and the packaging was solid.",
    "Absolutely love it — the fabric is soft and breathable and it fits exactly as expected. Easily the best {cat} I have owned at this price.",
    "Quality is a clear step above the usual marketplace stuff. Comfortable right out of the box and the color matches the listing photos perfectly.",
    "Third purchase from this brand and they never miss. Worth every rupee — the {cat} feels durable and the finishing is flawless.",
    "Perfect for daily wear. The fit is true to the size chart, the material breathes well, and shipping was quick.",
    "Wow, just wow. Premium feel, great stitching, arrived fast. My whole family wants one now.",
    "Very happy with this order. Comfortable, well made and the value for money is honestly unbeatable.",
    "The {cat} looks even better in person. Solid craftsmanship, comfortable fit, and delivery was faster than promised.",
    "Five stars without hesitation. Great quality, fits perfectly, and it survived a full wash cycle without any fading.",
    "Excellent overall — sturdy material, smooth finish, packaged really well. Would recommend to anyone on the fence.",
  ],
  4: [
    "Really good {cat} overall. Material is solid and it fits well — only reason for 4 stars is the delivery took a day longer than promised.",
    "Happy with the purchase. Quality is good for the price, though the color is a shade darker than the photos.",
    "Comfortable and well stitched. Slight loose feel around the cuffs but nothing that ruins it for me.",
    "Good value for money. The fabric feels nice and the finishing is neat — packaging could have been better though.",
    "Solid choice. Fits as expected and feels premium for this price range. Would have loved a slightly softer inner lining.",
    "Ordered for daily use and it delivers. Good stitching, comfortable, only minor gripe is the brand tag placement.",
    "Four stars — the {cat} itself is great, but the courier delayed my delivery by two days.",
    "Nice quality and quick delivery. Runs very slightly small but nothing worth returning over.",
  ],
  3: [
    "It's okay for the price, nothing more. Material is average and the stitching is sloppy in places, though the fit itself is fine.",
    "Mixed feelings. The design is nice and it's comfortable, but the fabric feels cheap and thinner than advertised.",
    "Decent {cat} but the photos oversell it. Fits true to size, delivery was on time, yet the material feels mediocre.",
    "Not bad, not great. Comfortable enough for the price but the finishing is sloppy and I have doubts about durability.",
    "The product does the job. Shipping was slow though — took almost two weeks, and the packaging was crushed.",
    "Average quality with a nice look. Loose threads around the seams and it already feels slightly faded after one wash.",
    "It fits okay and looks decent, but the material feels cheap for the price. Not sure I'd recommend it at full cost.",
    "Three stars — good design, but the material feels mediocre and the price should be lower for this build quality.",
  ],
  2: [
    "Disappointed with this one. The fabric started pilling after two wears and the stitching near the collar came loose.",
    "Wouldn't recommend. It runs tight around the chest and the material feels nothing like the description.",
    "Not worth the price at all. Cheap feel, awkward fit, and the color faded after the first wash.",
    "The {cat} arrived late and the packaging was damaged. Quality is mediocre and the fit is off.",
    "Regret this purchase. Very uncomfortable, the sizing is way off, and customer service was no help about the return.",
    "Poor quality overall. Fell apart at the seams within a month — you get what you pay for, and this wasn't much.",
  ],
  1: [
    "Terrible experience. The {cat} tore within a week, the smell out of the box was awful, and the seller ignored my messages. Returning it.",
    "Worst purchase this year. Nothing like the photos, the material is garbage, and it arrived two weeks late. Avoid.",
    "Fake-feeling product with sloppy stitching and a weird odor. Immediately requested a refund.",
    "Complete waste of money. It shrunk one full size after a gentle wash and the color bled onto everything else.",
    "Do not buy. Wrong item delivered, quality is horrible, and the 'premium fabric' claim is dishonest.",
  ],
};

const GENERIC_FAKE_BODIES = [
  "Best purchase ever, absolutely love it!",
  "Perfect quality, amazing, highly recommend!",
  "Wow excellent product fast delivery love it",
  "Amazing! Five stars! Perfect!",
  "Great product great seller amazing quality",
  "Love it! Perfect fit! Excellent!",
  "Excellent! Very good! Fast shipping!",
  "Perfect! Amazing quality! Ten out of ten!",
  "Good product, fast delivery, recommended!",
  "Very nice! Excellent quality! Love it!",
];

const DUPE_BODY =
  "Absolutely stunning piece! Premium quality material, perfect stitching and super fast delivery. 10/10 would buy again. Highly recommended to everyone!";
const DUPE_TITLE = "Absolutely amazing!!!";

// 5-star rating with contradictory negative text — the classic incentivized-review tell
const MISMATCH_BODIES = [
  "Arrived three weeks late and the hardware looks cheap. The leather creases oddly — not sure it is genuine.",
  "Packaging was plain and the strong smell out of the box was awful. The lining feels thin.",
  "Took long to arrive and the color is off from the photos. The zip feels flimsy. Disappointed.",
  "The zip sticks sometimes and the corners already look scratched and worn. Not impressed for this price.",
  "Strap hardware already tarnished and the stitching looks sloppy. Feels cheap, sorry to say.",
];

type Aspect = "quality" | "fit" | "comfort" | "price" | "shipping" | "durability";

const ASPECT_CLAUSES: Record<Aspect, { pos: string[]; neg: string[] }> = {
  quality: {
    pos: [
      "The stitching and fabric quality are genuinely premium.",
      "Material quality exceeded expectations for this range.",
    ],
    neg: [
      "The stitching is sloppy in places and the material feels cheap.",
      "Quality control is a joke — loose threads everywhere.",
    ],
  },
  fit: {
    pos: [
      "Fits true to size — I ordered my usual and it fits perfectly.",
      "True to size and the cut is flattering.",
      "Perfect fit straight out of the box.",
    ],
    neg: [
      "Runs small — size up if you're between sizes.",
      "Sizing runs at least one size small; I sized up and it finally fit.",
      "The cut is snug around the shoulders, so consider a larger size.",
      "Runs large and baggy — consider sizing down.",
    ],
  },
  comfort: {
    pos: [
      "Soft, breathable and comfortable for all-day wear.",
      "So comfortable I forget I'm wearing it.",
    ],
    neg: [
      "Uncomfortable after an hour — the fabric doesn't breathe at all.",
      "Scratchy and stiff, nothing like the softness promised.",
    ],
  },
  price: {
    pos: [
      "Great value for money at this price.",
      "Worth every rupee at this price point.",
    ],
    neg: [
      "Overpriced for what you actually get.",
      "Not worth the price — similar options are far cheaper.",
    ],
  },
  shipping: {
    pos: [
      "Delivery arrived early and the packaging was neat.",
      "Shipping was fast and the box was pristine.",
    ],
    neg: [
      "Shipping took forever and the packaging was crushed.",
      "Delivery was delayed by a week.",
    ],
  },
  durability: {
    pos: [
      "Feels durable — survived months of regular wear.",
      "Built to last; no pilling or fading after repeated washes.",
    ],
    neg: [
      "Started pilling and fading within weeks.",
      "Fell apart at the seams after light wear.",
    ],
  },
};

// Bags have no garment sizing — neutral, keyword-free "fit" language instead
const BAG_FIT_CLAUSES = [
  "Roomy enough for a phone, wallet and keys.",
  "The strap sits comfortably on the shoulder.",
  "Interior pockets are practical and well placed.",
];

// Scrub garment-fit phrasing out of generic bodies when the product is a bag
const BAG_BODY_FIXES: [RegExp, string][] = [
  [/Fits as expected/gi, "Looks as expected"],
  [/Fits true to size/gi, "Matches the listing photos"],
  [/fits perfectly/gi, "looks perfect"],
  [/fits exactly/gi, "looks exactly"],
  [/fit is fine/gi, "finish is fine"],
  [/It fits okay/gi, "It looks okay"],
  [/awkward fit/gi, "awkward shape"],
  [/the sizing is way off/gi, "the quality is way off"],
  [/runs very slightly small/gi, "runs slightly smaller than the photos suggest"],
  [/Perfect fit straight out of the box/gi, "Great proportions straight out of the box"],
  [/true to the size chart/gi, "true to the listing photos"],
  [/runs tight around the chest/gi, "feels stiff around the edges"],
  [/Perfect fit/gi, "Perfect proportions"],
];

/* ------------------------------ Product configs --------------------------- */

interface ListingCfg {
  marketplace: (typeof MARKETPLACES)[number];
  price: number;
  currency: "PKR" | "USD";
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  deliveryDays: number;
}

interface ProductCfg {
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  hue: number;
  catNoun: string;
  listings: ListingCfg[];
  priceCurve: { type: "stable" | "declining" | "rising" | "promo"; start: number; end: number };
  trend: { type: "rising" | "stable" | "cooling"; start: number; end: number; peakWeek?: number; peakValue?: number };
  weights: [number, number, number, number, number]; // 5,4,3,2,1
  verifiedShare: number;
  aspectTargets: Record<Aspect, number>;
  reviewCount: number;
  fake?: { dupes?: number; generic?: number; burst?: number; mismatch?: number; dupeWindowDays?: number };
  seed: number;
}

const PRODUCTS: ProductCfg[] = [
  {
    slug: "nike-air-force-1-07",
    name: "Nike Air Force 1 '07",
    brand: "Nike",
    category: "Sneakers",
    description: "The radiance lives on in the Nike Air Force 1 '07 — crisp leather, everyday wearability and the iconic AF1 silhouette.",
    hue: 42,
    catNoun: "pair of sneakers",
    listings: [
      { marketplace: "DARAZ", price: 24499, currency: "PKR", originalPrice: 28999, rating: 4.6, reviewCount: 3241, deliveryDays: 4 },
      { marketplace: "AMAZON", price: 115, currency: "USD", rating: 4.7, reviewCount: 18432, deliveryDays: 3 },
      { marketplace: "ALIEXPRESS", price: 89.99, currency: "USD", rating: 4.5, reviewCount: 5231, deliveryDays: 12 },
      { marketplace: "INSTAGRAM", price: 26999, currency: "PKR", rating: 4.8, reviewCount: 640, deliveryDays: 5 },
    ],
    priceCurve: { type: "declining", start: 28200, end: 25749 },
    trend: { type: "stable", start: 58, end: 64 },
    weights: [0.58, 0.22, 0.09, 0.06, 0.05],
    verifiedShare: 0.76,
    aspectTargets: { quality: 80, fit: 70, comfort: 75, price: 45, shipping: 65, durability: 55 },
    reviewCount: 27,
    seed: 101,
  },
  {
    slug: "adidas-ultraboost-light",
    name: "Adidas Ultraboost Light",
    brand: "Adidas",
    category: "Running Shoes",
    description: "Lightest Ultraboost ever — LIGHTBOOST foam returns energy with every stride, wrapped in a snug Primeknit upper.",
    hue: 18,
    catNoun: "pair of running shoes",
    listings: [
      { marketplace: "DARAZ", price: 38999, currency: "PKR", originalPrice: 42999, rating: 4.5, reviewCount: 1876, deliveryDays: 5 },
      { marketplace: "AMAZON", price: 140, currency: "USD", originalPrice: 160, rating: 4.6, reviewCount: 9211, deliveryDays: 2 },
      { marketplace: "ALIEXPRESS", price: 112.5, currency: "USD", rating: 4.4, reviewCount: 3120, deliveryDays: 14 },
      { marketplace: "INSTAGRAM", price: 41500, currency: "PKR", rating: 4.5, reviewCount: 312, deliveryDays: 6 },
    ],
    priceCurve: { type: "stable", start: 41000, end: 40249 },
    trend: { type: "rising", start: 32, end: 58 },
    weights: [0.6, 0.22, 0.09, 0.05, 0.04],
    verifiedShare: 0.7,
    aspectTargets: { quality: 70, fit: 55, comfort: 85, price: 40, shipping: 55, durability: 60 },
    reviewCount: 25,
    seed: 202,
  },
  {
    slug: "asics-gel-kayano-31",
    name: "Asics Gel-Kayano 31",
    brand: "Asics",
    category: "Running Shoes",
    description: "Max cushioning meets stability — 4D Guidance System and PureGEL for supportive, smooth long-distance runs.",
    hue: 350,
    catNoun: "pair of running shoes",
    listings: [
      { marketplace: "DARAZ", price: 42990, currency: "PKR", rating: 4.4, reviewCount: 964, deliveryDays: 6 },
      { marketplace: "AMAZON", price: 175, currency: "USD", originalPrice: 180, rating: 4.5, reviewCount: 4310, deliveryDays: 3 },
      { marketplace: "ALIEXPRESS", price: 138, currency: "USD", rating: 4.3, reviewCount: 1870, deliveryDays: 13 },
      { marketplace: "INSTAGRAM", price: 45900, currency: "PKR", rating: 4.4, reviewCount: 158, deliveryDays: 6 },
    ],
    priceCurve: { type: "rising", start: 41000, end: 44445 },
    trend: { type: "stable", start: 47, end: 52 },
    weights: [0.42, 0.26, 0.14, 0.1, 0.08],
    verifiedShare: 0.55,
    aspectTargets: { quality: 55, fit: 40, comfort: 70, price: 20, shipping: 40, durability: 45 },
    reviewCount: 26,
    fake: { burst: 5, generic: 2 },
    seed: 303,
  },
  {
    slug: "nike-club-fleece-hoodie",
    name: "Nike Club Fleece Pullover Hoodie",
    brand: "Nike",
    category: "Hoodies",
    description: "Soft, warm and endlessly wearable — brushed-back fleece with a relaxed fit and the classic club ribbed cuffs.",
    hue: 26,
    catNoun: "hoodie",
    listings: [
      { marketplace: "DARAZ", price: 13499, currency: "PKR", rating: 4.5, reviewCount: 2210, deliveryDays: 4 },
      { marketplace: "AMAZON", price: 60, currency: "USD", rating: 4.6, reviewCount: 15432, deliveryDays: 3 },
      { marketplace: "ALIEXPRESS", price: 44.5, currency: "USD", rating: 4.3, reviewCount: 2870, deliveryDays: 12 },
      { marketplace: "INSTAGRAM", price: 15999, currency: "PKR", rating: 4.6, reviewCount: 428, deliveryDays: 5 },
    ],
    priceCurve: { type: "stable", start: 14800, end: 14749 },
    trend: { type: "rising", start: 36, end: 61 },
    weights: [0.52, 0.24, 0.11, 0.07, 0.06],
    verifiedShare: 0.68,
    aspectTargets: { quality: 70, fit: 55, comfort: 80, price: 55, shipping: 55, durability: 50 },
    reviewCount: 25,
    seed: 404,
  },
  {
    slug: "dynamite-fleece-hoodie",
    name: "Dynamite Winter Fleece Hoodie",
    brand: "Dynamite",
    category: "Hoodies",
    description: "Budget-friendly heavyweight fleece hoodie from a local Pakistani label — warm, roomy and made for winter layering.",
    hue: 0,
    catNoun: "hoodie",
    listings: [
      { marketplace: "DARAZ", price: 4299, currency: "PKR", originalPrice: 5499, rating: 4.1, reviewCount: 986, deliveryDays: 6 },
      { marketplace: "AMAZON", price: 24.99, currency: "USD", rating: 4.0, reviewCount: 640, deliveryDays: 4 },
      { marketplace: "ALIEXPRESS", price: 16.9, currency: "USD", rating: 4.0, reviewCount: 1740, deliveryDays: 13 },
      { marketplace: "INSTAGRAM", price: 4999, currency: "PKR", rating: 4.2, reviewCount: 205, deliveryDays: 7 },
    ],
    priceCurve: { type: "stable", start: 4700, end: 4649 },
    trend: { type: "stable", start: 44, end: 47 },
    weights: [0.36, 0.28, 0.16, 0.12, 0.08],
    verifiedShare: 0.45,
    aspectTargets: { quality: 25, fit: 30, comfort: 60, price: 70, shipping: 30, durability: 0 },
    reviewCount: 24,
    seed: 505,
  },
  {
    slug: "khaadi-embroidered-pret-2-piece",
    name: "Khaadi Embroidered Pret 2-Piece",
    brand: "Khaadi",
    category: "Pret Wear",
    description: "Signature Khaadi embroidery on breathable lawn — a ready-to-wear 2-piece that moves effortlessly from day to evening.",
    hue: 38,
    catNoun: "pret suit",
    listings: [
      { marketplace: "DARAZ", price: 9990, currency: "PKR", originalPrice: 11500, rating: 4.6, reviewCount: 1543, deliveryDays: 5 },
      { marketplace: "AMAZON", price: 52, currency: "USD", rating: 4.5, reviewCount: 210, deliveryDays: 6 },
      { marketplace: "ALIEXPRESS", price: 41, currency: "USD", rating: 4.4, reviewCount: 480, deliveryDays: 15 },
      { marketplace: "INSTAGRAM", price: 11499, currency: "PKR", rating: 4.7, reviewCount: 390, deliveryDays: 6 },
    ],
    priceCurve: { type: "stable", start: 11000, end: 10744 },
    trend: { type: "rising", start: 29, end: 57 },
    weights: [0.63, 0.21, 0.08, 0.05, 0.03],
    verifiedShare: 0.62,
    aspectTargets: { quality: 80, fit: 45, comfort: 60, price: 50, shipping: 45, durability: 40 },
    reviewCount: 26,
    seed: 606,
  },
  {
    slug: "gul-ahmed-3-piece-suit",
    name: "Gul Ahmed Embroidered 3-Piece Suit",
    brand: "Gul Ahmed",
    category: "Pret Wear",
    description: "Classic Gul Ahmed three-piece with embroidered dupatta — traditional craft in a contemporary cut, unstitched comfort included.",
    hue: 330,
    catNoun: "three-piece suit",
    listings: [
      { marketplace: "DARAZ", price: 12450, currency: "PKR", originalPrice: 14000, rating: 4.3, reviewCount: 1204, deliveryDays: 6 },
      { marketplace: "AMAZON", price: 58, currency: "USD", rating: 4.3, reviewCount: 160, deliveryDays: 7 },
      { marketplace: "ALIEXPRESS", price: 47, currency: "USD", rating: 4.2, reviewCount: 350, deliveryDays: 16 },
      { marketplace: "INSTAGRAM", price: 13900, currency: "PKR", rating: 4.4, reviewCount: 260, deliveryDays: 7 },
    ],
    priceCurve: { type: "stable", start: 13100, end: 13175 },
    trend: { type: "stable", start: 48, end: 51 },
    weights: [0.52, 0.24, 0.11, 0.08, 0.05],
    verifiedShare: 0.58,
    aspectTargets: { quality: 50, fit: 25, comfort: 50, price: 35, shipping: 30, durability: 25 },
    reviewCount: 25,
    seed: 707,
  },
  {
    slug: "sapphire-printed-kurta",
    name: "Sapphire Printed Lawn Kurta",
    brand: "Sapphire",
    category: "Kurtas",
    description: "Sapphire's signature digital prints on soft lawn — a straight-cut kurta for everyday effortless styling.",
    hue: 315,
    catNoun: "kurta",
    listings: [
      { marketplace: "DARAZ", price: 5690, currency: "PKR", rating: 4.0, reviewCount: 742, deliveryDays: 5 },
      { marketplace: "AMAZON", price: 34, currency: "USD", rating: 3.9, reviewCount: 96, deliveryDays: 6 },
      { marketplace: "ALIEXPRESS", price: 26.5, currency: "USD", rating: 3.8, reviewCount: 210, deliveryDays: 15 },
      { marketplace: "INSTAGRAM", price: 6450, currency: "PKR", rating: 4.1, reviewCount: 140, deliveryDays: 6 },
    ],
    priceCurve: { type: "rising", start: 5300, end: 6070 },
    trend: { type: "cooling", start: 40, end: 38, peakWeek: 7, peakValue: 64 },
    weights: [0.36, 0.26, 0.16, 0.12, 0.1],
    verifiedShare: 0.42,
    aspectTargets: { quality: 20, fit: -50, comfort: 25, price: 55, shipping: 20, durability: 0 },
    reviewCount: 24,
    seed: 808,
  },
  {
    slug: "north-face-1996-nuptse-jacket",
    name: "The North Face 1996 Retro Nuptse Jacket",
    brand: "The North Face",
    category: "Winter Jackets",
    description: "Iconic boxy silhouette with 700-fill down insulation — the retro Nuptse remains the gold standard of winter warmth.",
    hue: 22,
    catNoun: "jacket",
    listings: [
      { marketplace: "DARAZ", price: 74999, currency: "PKR", originalPrice: 82000, rating: 4.5, reviewCount: 412, deliveryDays: 6 },
      { marketplace: "AMAZON", price: 330, currency: "USD", originalPrice: 350, rating: 4.7, reviewCount: 5620, deliveryDays: 3 },
      { marketplace: "ALIEXPRESS", price: 285, currency: "USD", rating: 4.4, reviewCount: 1230, deliveryDays: 15 },
      { marketplace: "INSTAGRAM", price: 79500, currency: "PKR", rating: 4.6, reviewCount: 88, deliveryDays: 7 },
    ],
    priceCurve: { type: "promo", start: 81500, end: 77249 },
    trend: { type: "cooling", start: 55, end: 44, peakWeek: 5, peakValue: 71 },
    weights: [0.5, 0.26, 0.1, 0.08, 0.06],
    verifiedShare: 0.62,
    aspectTargets: { quality: 80, fit: 45, comfort: 85, price: 35, shipping: 50, durability: 75 },
    reviewCount: 24,
    seed: 909,
  },
  {
    slug: "levis-511-slim-jeans",
    name: "Levi's 511 Slim Fit Jeans",
    brand: "Levi's",
    category: "Jeans",
    description: "The definitive slim fit — Levi's 511 with just enough stretch, cut close through the thigh and leg opening.",
    hue: 0,
    catNoun: "pair of jeans",
    listings: [
      { marketplace: "DARAZ", price: 14990, currency: "PKR", rating: 4.2, reviewCount: 1689, deliveryDays: 5 },
      { marketplace: "AMAZON", price: 69.5, currency: "USD", originalPrice: 78, rating: 4.4, reviewCount: 21430, deliveryDays: 2 },
      { marketplace: "ALIEXPRESS", price: 39.9, currency: "USD", rating: 4.0, reviewCount: 4310, deliveryDays: 13 },
      { marketplace: "INSTAGRAM", price: 16500, currency: "PKR", rating: 4.3, reviewCount: 310, deliveryDays: 6 },
    ],
    priceCurve: { type: "stable", start: 15600, end: 15745 },
    trend: { type: "stable", start: 52, end: 55 },
    weights: [0.5, 0.25, 0.12, 0.08, 0.05],
    verifiedShare: 0.42,
    aspectTargets: { quality: 55, fit: -25, comfort: 45, price: 30, shipping: 45, durability: 60 },
    reviewCount: 26,
    fake: { dupes: 2, generic: 3 },
    seed: 1010,
  },
  {
    slug: "uniqlo-u-crew-tee",
    name: "Uniqlo U Crew Neck T-Shirt",
    brand: "Uniqlo",
    category: "T-Shirts",
    description: "Airism cotton blend with a relaxed silhouette — the Uniqlo U crew that built a cult following on fit and fabric alone.",
    hue: 30,
    catNoun: "t-shirt",
    listings: [
      { marketplace: "DARAZ", price: 3290, currency: "PKR", rating: 4.4, reviewCount: 980, deliveryDays: 5 },
      { marketplace: "AMAZON", price: 19.9, currency: "USD", rating: 4.5, reviewCount: 8210, deliveryDays: 3 },
      { marketplace: "ALIEXPRESS", price: 14.5, currency: "USD", rating: 4.2, reviewCount: 2140, deliveryDays: 12 },
      { marketplace: "INSTAGRAM", price: 3830, currency: "PKR", rating: 4.4, reviewCount: 175, deliveryDays: 5 },
    ],
    priceCurve: { type: "stable", start: 3600, end: 3560 },
    trend: { type: "rising", start: 26, end: 52 },
    weights: [0.5, 0.26, 0.12, 0.07, 0.05],
    verifiedShare: 0.55,
    aspectTargets: { quality: 65, fit: 50, comfort: 70, price: 80, shipping: 50, durability: 35 },
    reviewCount: 24,
    seed: 1111,
  },
  {
    slug: "coach-tabby-26-bag",
    name: "Coach Tabby 26 Pillow Bag",
    brand: "Coach",
    category: "Handbags",
    description: "The viral Tabby 26 in puffy quilted leather — everywhere on Instagram feeds, with a secondhand market to match the hype.",
    hue: 340,
    catNoun: "bag",
    listings: [
      { marketplace: "DARAZ", price: 68500, currency: "PKR", originalPrice: 79000, rating: 4.1, reviewCount: 530, deliveryDays: 6 },
      { marketplace: "AMAZON", price: 395, currency: "USD", rating: 4.2, reviewCount: 890, deliveryDays: 4 },
      { marketplace: "ALIEXPRESS", price: 189, currency: "USD", rating: 4.5, reviewCount: 1650, deliveryDays: 14 },
      { marketplace: "INSTAGRAM", price: 72000, currency: "PKR", rating: 4.4, reviewCount: 230, deliveryDays: 8 },
    ],
    priceCurve: { type: "rising", start: 69000, end: 70250 },
    trend: { type: "cooling", start: 55, end: 41, peakWeek: 6, peakValue: 69 },
    weights: [0.32, 0.2, 0.14, 0.12, 0.22],
    verifiedShare: 0.32,
    aspectTargets: { quality: -25, fit: 10, comfort: 15, price: -60, shipping: 10, durability: -30 },
    reviewCount: 30,
    fake: { dupes: 7, generic: 8, mismatch: 5, dupeWindowDays: 3 },
    seed: 1212,
  },
];

/* ---------------------------- Review generation --------------------------- */

interface GeneratedReview {
  marketplace: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  daysAgo: number;
  verified: boolean;
}

function pickMarketplace(rand: () => number): string {
  const x = rand();
  let acc = 0;
  for (let i = 0; i < MARKETPLACES.length; i++) {
    acc += MP_WEIGHTS[i];
    if (x <= acc) return MARKETPLACES[i];
  }
  return "DARAZ";
}

function pickAspect(rand: () => number, targets: Record<Aspect, number>, exclude: Aspect[]): Aspect | null {
  const keys = (Object.keys(targets) as Aspect[]).filter((k) => !exclude.includes(k));
  const weighted: Aspect[] = [];
  for (const k of keys) {
    const w = Math.max(1, Math.round(Math.abs(targets[k]) / 10));
    for (let i = 0; i < w; i++) weighted.push(k);
  }
  if (weighted.length === 0) return null;
  return weighted[Math.floor(rand() * weighted.length)];
}

function generateReviews(cfg: ProductCfg): GeneratedReview[] {
  const rand = mulberry32(cfg.seed);
  const { catNoun, aspectTargets } = cfg;
  const isBag = cfg.category === "Handbags";
  const authors = [...AUTHORS].sort(() => rand() - 0.5);
  let authorIdx = 0;
  const nextAuthor = () => authors[authorIdx++ % authors.length];

  const tokenize = (t: string) => new Set(t.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2));
  const jaccard = (a: Set<string>, b: Set<string>) => {
    if (a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const t of a) if (b.has(t)) inter++;
    return inter / (a.size + b.size - inter);
  };

  const reviews: GeneratedReview[] = [];
  const usedTokenSets: Set<string>[] = [];
  const fixBody = (t: string) =>
    isBag ? BAG_BODY_FIXES.reduce((acc, [re, rep]) => acc.replace(re, rep), t) : t;

  const daysAgoSample = () => 2 + Math.floor(178 * Math.pow(rand(), 1.4));
  const isVerified = (mp: string) => rand() < Math.min(0.95, cfg.verifiedShare + (mp === "AMAZON" ? 0.15 : 0));

  // ---- injected fake patterns ----
  const fakeDaysStart = 5 + Math.floor(rand() * 8);
  if (cfg.fake?.dupes) {
    for (let i = 0; i < cfg.fake.dupes; i++) {
      reviews.push({
        marketplace: rand() < 0.6 ? "ALIEXPRESS" : "INSTAGRAM",
        author: nextAuthor(),
        rating: 5,
        title: DUPE_TITLE,
        body: fixBody(DUPE_BODY),
        daysAgo: fakeDaysStart + (i % (cfg.fake.dupeWindowDays ?? 1)),
        verified: false,
      });
    }
  }
  if (cfg.fake?.burst) {
    for (let i = 0; i < cfg.fake.burst; i++) {
      const b = GENERIC_FAKE_BODIES[Math.floor(rand() * GENERIC_FAKE_BODIES.length)];
      reviews.push({
        marketplace: rand() < 0.7 ? "INSTAGRAM" : "DARAZ",
        author: nextAuthor(),
        rating: 5,
        title: TITLES[5][Math.floor(rand() * TITLES[5].length)],
        body: fixBody(b),
        daysAgo: fakeDaysStart + Math.floor(rand() * 2),
        verified: false,
      });
    }
  }
  if (cfg.fake?.mismatch) {
    for (let i = 0; i < cfg.fake.mismatch; i++) {
      reviews.push({
        marketplace: rand() < 0.5 ? "ALIEXPRESS" : "AMAZON",
        author: nextAuthor(),
        rating: 5,
        title: TITLES[5][Math.floor(rand() * TITLES[5].length)],
        body: fixBody(MISMATCH_BODIES[i % MISMATCH_BODIES.length]),
        daysAgo: daysAgoSample(),
        verified: false,
      });
    }
  }
  if (cfg.fake?.generic) {
    for (let i = 0; i < cfg.fake.generic; i++) {
      const b = GENERIC_FAKE_BODIES[Math.floor(rand() * GENERIC_FAKE_BODIES.length)];
      reviews.push({
        marketplace: pickMarketplace(rand),
        author: nextAuthor(),
        rating: 5,
        title: TITLES[5][Math.floor(rand() * TITLES[5].length)],
        body: fixBody(b),
        daysAgo: daysAgoSample(),
        verified: false,
      });
    }
  }

  // ---- organic reviews per rating distribution ----
  const slots = cfg.reviewCount - reviews.length;
  const counts = cfg.weights.map((w) => Math.floor(w * slots));
  let remainder = slots - counts.reduce((a, b) => a + b, 0);
  const tiers: Tier[] = [5, 4, 3, 2, 1];
  const tierOrder = [...tiers].sort((a, b) => cfg.weights[tiers.indexOf(b)] - cfg.weights[tiers.indexOf(a)]);
  let ri = 0;
  while (remainder > 0) {
    counts[tiers.indexOf(tierOrder[ri % tiers.length])] += 1;
    ri++;
    remainder--;
  }

  const tierBodies: Record<number, string[]> = {};
  for (const t of tiers) tierBodies[t] = [...BODIES[t]].sort(() => rand() - 0.5);
  const tierBodyIdx: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const tier of tiers) {
    for (let i = 0; i < counts[tiers.indexOf(tier)]; i++) {
      const mp = pickMarketplace(rand);

      // pick a base body that stays dissimilar to everything used so far
      let body = "";
      let tokens = new Set<string>();
      for (let attempt = 0; attempt < 12; attempt++) {
        const pool = tierBodies[tier];
        body = pool[tierBodyIdx[tier] % pool.length].replace(/\{cat\}/g, catNoun);
        tierBodyIdx[tier]++;
        if (isBag) for (const [re, rep] of BAG_BODY_FIXES) body = body.replace(re, rep);
        tokens = tokenize(`${TITLES[tier][0]} ${body}`);
        if (!usedTokenSets.some((u) => jaccard(u, tokens) >= 0.65)) break;
      }

      // append 1-2 aspect clauses to steer aspect signals
      const usedAspects: Aspect[] = [];
      const clauseCount = tier === 3 ? (rand() < 0.5 ? 1 : 0) : rand() < 0.72 ? (rand() < 0.4 ? 2 : 1) : 0;
      for (let c = 0; c < clauseCount; c++) {
        const aspect = pickAspect(rand, aspectTargets, usedAspects);
        if (!aspect) break;
        usedAspects.push(aspect);
        const target = aspectTargets[aspect];
        // fit clauses keep a touch of realistic jitter even on well-fitting products
        const wantNegative =
          target < 0 || (aspect === "fit" && !isBag && target >= 0 && rand() < 0.28);
        // positive clauses never land on clearly negative reviews; 3-star stays mixed
        if (!wantNegative && tier <= 2) continue;
        if (tier === 3 && !wantNegative && rand() < 0.5) continue;
        // negative clauses on glowing reviews only make sense for fit
        if (wantNegative && tier >= 4 && aspect !== "fit") continue;
        if (aspect === "fit" && isBag) {
          body += " " + BAG_FIT_CLAUSES[Math.floor(rand() * BAG_FIT_CLAUSES.length)];
          continue;
        }
        const pool = wantNegative ? ASPECT_CLAUSES[aspect].neg : ASPECT_CLAUSES[aspect].pos;
        body += " " + pool[Math.floor(rand() * pool.length)];
      }

      usedTokenSets.push(tokenize(body));
      reviews.push({
        marketplace: mp,
        author: nextAuthor(),
        rating: tier,
        title: TITLES[tier][Math.floor(rand() * TITLES[tier].length)],
        body,
        daysAgo: daysAgoSample(),
        verified: isVerified(mp),
      });
    }
  }

  // shuffle so fake reviews are interleaved
  return reviews.sort(() => rand() - 0.5);
}

/* ------------------------------ Curve helpers ----------------------------- */

function buildPriceCurve(cfg: ProductCfg): number[] {
  const rand = mulberry32(cfg.seed * 7 + 13);
  const { type, start, end } = cfg.priceCurve;
  const points: number[] = [];
  for (let week = 0; week < 12; week++) {
    const t = week / 11;
    let value: number;
    if (type === "stable") {
      // gentle wave around the anchor price
      value = end * (1 + Math.sin(week * 1.9 + cfg.seed) * 0.015 + (rand() - 0.5) * 0.018);
    } else {
      value = start + (end - start) * t;
      if (type === "promo" && (week === 3 || week === 8)) value *= 0.92;
      value += (rand() - 0.5) * start * 0.012;
    }
    points.push(Math.round(value));
  }
  points[11] = end;
  return points;
}

function buildTrendCurve(cfg: ProductCfg): number[] {
  const rand = mulberry32(cfg.seed * 11 + 29);
  const { type, start, end, peakWeek, peakValue } = cfg.trend;
  const points: number[] = [];
  for (let week = 0; week < 12; week++) {
    let value: number;
    if (type === "cooling" && peakWeek !== undefined && peakValue !== undefined) {
      const rise = peakValue - start;
      const fall = peakValue - end;
      const peakSpan = Math.max(1, peakWeek);
      const fallSpan = Math.max(1, 11 - peakWeek);
      value =
        week <= peakWeek
          ? start + rise * (week / peakSpan)
          : peakValue - fall * ((week - peakWeek) / fallSpan);
    } else {
      value = start + (end - start) * (week / 11);
    }
    value += (rand() - 0.5) * 6;
    points.push(Math.round(Math.min(100, Math.max(4, value))));
  }
  if (type === "cooling" && peakWeek !== undefined && peakValue !== undefined) {
    points[peakWeek] = peakValue;
  }
  points[11] = Math.max(4, end + Math.round((rand() - 0.5) * 4));
  return points;
}

/* --------------------------------- Seeding -------------------------------- */

async function main() {
  console.log("Seeding TrendLens data…");

  await db.review.deleteMany();
  await db.listing.deleteMany();
  await db.priceHistory.deleteMany();
  await db.trendPoint.deleteMany();
  await db.product.deleteMany();

  for (const cfg of PRODUCTS) {
    const reviews = generateReviews(cfg);
    const priceHistory = buildPriceCurve(cfg);
    const trendPoints = buildTrendCurve(cfg);

    const momentum = trendPoints[11] - trendPoints[3];

    const product = await db.product.create({
      data: {
        slug: cfg.slug,
        name: cfg.name,
        brand: cfg.brand,
        category: cfg.category,
        description: cfg.description,
        hue: cfg.hue,
        momentumScore: momentum,
        peakWeek: cfg.trend.type === "cooling" ? (cfg.trend.peakWeek ?? null) : null,
      },
    });

    await db.listing.createMany({
      data: cfg.listings.map((l) => ({
        productId: product.id,
        marketplace: l.marketplace,
        price: l.price,
        currency: l.currency,
        originalPrice: l.originalPrice ?? null,
        rating: l.rating,
        reviewCount: l.reviewCount,
        deliveryDays: l.deliveryDays,
      })),
    });

    await db.priceHistory.createMany({
      data: priceHistory.map((price, week) => ({ productId: product.id, week, price })),
    });

    await db.trendPoint.createMany({
      data: trendPoints.map((interest, week) => ({ productId: product.id, week, interest })),
    });

    await db.review.createMany({
      data: reviews.map((r) => ({
        productId: product.id,
        marketplace: r.marketplace,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        daysAgo: r.daysAgo,
        verified: r.verified,
      })),
    });

    console.log(`  ✓ ${cfg.name} — ${reviews.length} reviews, ${cfg.listings.length} listings`);
  }

  const totals = await db.review.count();
  console.log(`Done. ${PRODUCTS.length} products, ${totals} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
