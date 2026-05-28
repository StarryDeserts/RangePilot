export type MarketProduct = "MOVE" | "UP" | "DOWN" | "RANGE";

const PRODUCTS = new Set<MarketProduct>(["MOVE", "UP", "DOWN", "RANGE"]);

export function normalizeMarketProduct(value: string | null | undefined): MarketProduct {
  const normalized = value?.trim().toUpperCase();
  return PRODUCTS.has(normalized as MarketProduct) ? (normalized as MarketProduct) : "MOVE";
}

export function productHref(product: MarketProduct): string {
  return `/markets/btc?product=${product}`;
}

const VERIFIED_TRADING_ROUTES: Record<MarketProduct, string> = {
  MOVE: "/buy/btc-move",
  UP: "/primitives?type=UP",
  DOWN: "/primitives?type=DOWN",
  RANGE: "/primitives?type=RANGE",
};

export function verifiedTradingPath(product: MarketProduct): string {
  return VERIFIED_TRADING_ROUTES[product];
}

export function verifiedTradingHref(product: MarketProduct): string {
  const path = verifiedTradingPath(product);
  const base = import.meta.env.VITE_DEEPVOL_VERIFIED_APP_URL?.trim().replace(/\/+$/, "") ?? "";

  return base ? `${base}${path}` : path;
}

export function productFromSearch(search: string): MarketProduct {
  const params = new URLSearchParams(search);
  return normalizeMarketProduct(params.get("product") ?? params.get("type"));
}

export function legacyPrimitiveProductFromSearch(search: string): MarketProduct {
  const product = normalizeMarketProduct(new URLSearchParams(search).get("type"));
  return product === "MOVE" ? "UP" : product;
}
