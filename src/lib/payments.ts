export const PREMIUM_PRICE_ARS = 9900;
export const PREMIUM_PRICE_CENTS = PREMIUM_PRICE_ARS * 100;
export const PREMIUM_ITEM_TITLE = "CostoReal Premium — Acceso de por vida";

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
