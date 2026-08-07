"use client";

import type { ReactNode } from "react";
import type { ItemType, PricingResult } from "@/lib/pricing";
import RollingNumber from "@/components/RollingNumber";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const UNIT_SHORT: Record<ItemType, string> = {
  producto: "u",
  servicio: "serv.",
  digital: "ventas",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className="font-display mt-1 text-base font-bold tracking-tight text-cream">
        {value}
      </p>
    </div>
  );
}

export default function ResultPanel({
  result,
  mode,
  unitsMonth,
  range,
  discountPercent = 0,
  channelCommission = 0,
  shippingPerSale = 0,
  monthlyGoal = 0,
  itemType = "producto",
  children,
  emptyText = "Cargá tus costos para ver tu precio real.",
}: {
  result: PricingResult | null;
  mode: "margin" | "target";
  unitsMonth: number;
  range?: { floor: string; cap: string } | null;
  discountPercent?: number;
  channelCommission?: number;
  shippingPerSale?: number;
  monthlyGoal?: number;
  itemType?: ItemType;
  children?: ReactNode;
  emptyText?: string;
}) {
  const canCalculate = result !== null && result.totalCostUnit > 0;
  const unit = UNIT_SHORT[itemType];
  const hasDiscount = discountPercent > 0;
  const hasChannel = channelCommission > 0 || shippingPerSale > 0;
  const hasGoal = monthlyGoal > 0;

  let breakEvenPct: number | null = null;
  let aboveBreakEven: boolean | null = null;
  if (canCalculate && result.breakEvenUnits > 0 && unitsMonth > 0) {
    breakEvenPct = Math.min(1, unitsMonth / result.breakEvenUnits);
    aboveBreakEven = breakEvenPct >= 1;
  }

  const mainPrice = canCalculate
    ? hasDiscount
      ? result.effectivePrice
      : result.price
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-cream shadow-[0_30px_70px_-30px_rgba(14,31,23,0.7)] sm:p-7">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-moneda-bright/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">
            Precio de venta sugerido
          </span>
          {canCalculate && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              En vivo
            </span>
          )}
        </div>

        <p className="font-display mt-3 text-4xl font-bold leading-none tracking-tight text-cream sm:text-5xl">
          {mainPrice !== null ? (
            <RollingNumber value={mainPrice} />
          ) : (
            <span className="text-stone-500">—</span>
          )}
        </p>

        {canCalculate && hasDiscount && (
          <p className="mt-2 font-mono text-[11px] text-stone-400">
            de lista {ars.format(result.price)} · con descuento del{" "}
            {discountPercent}%
          </p>
        )}

        <p className="mt-3 font-mono text-xs text-stone-300">
          {canCalculate
            ? mode === "margin"
              ? `Margen real · ${result.marginPercent.toFixed(1)}% (${ars.format(result.marginAmount)})`
              : `Margen que te deja · ${result.marginPercent.toFixed(1)}% (${ars.format(result.marginAmount)})`
            : "Esperando tus números…"}
        </p>

        {canCalculate && result.belowFloor && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-ochre/40 bg-ochre/15 px-3 py-2 text-xs font-medium text-amber-200">
            <span aria-hidden="true">⚠</span>
            Con este descuento te quedás por debajo de tu margen mínimo (
            {Math.round(result.marginPercent)}% &lt; piso{" "}
            {range ? range.floor : "—"}%).
          </p>
        )}

        {canCalculate && hasChannel && (
          <p className="mt-3 font-mono text-[11px] text-stone-400">
            Comisión de canal + envío: {ars.format(result.channelCostUnit)} por{" "}
            {itemType === "producto" ? "unidad" : "venta"} · ya incluidos en el precio
          </p>
        )}

        {canCalculate && breakEvenPct !== null && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-stone-400">
              <span>Punto de equilibrio</span>
              <span className="text-right">
                {aboveBreakEven
                  ? `Vendés por encima · necesitás ${result.breakEvenUnits.toFixed(1)} ${unit}/mes`
                  : `Faltan ${Math.max(0, result.breakEvenUnits - unitsMonth).toFixed(1)} ${unit} para no perder`}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  aboveBreakEven ? "bg-moneda-bright" : "bg-ochre"
                }`}
                style={{ width: `${breakEvenPct * 100}%` }}
              />
            </div>
          </div>
        )}

        {canCalculate && hasGoal && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Para ganar {ars.format(monthlyGoal)}/mes
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-emerald-300">
              {result.unitsForGoal.toFixed(1)} {unit}/mes
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat
            label={`Costo variable / ${itemType === "producto" ? "u" : "venta"}`}
            value={canCalculate ? ars.format(result.variableCostUnit) : "—"}
          />
          <Stat
            label={`Costo fijo / ${itemType === "producto" ? "u" : "venta"}`}
            value={canCalculate ? ars.format(result.fixedCostUnit) : "—"}
          />
          <Stat
            label={`Costo total / ${itemType === "producto" ? "u" : "venta"}`}
            value={canCalculate ? ars.format(result.totalCostUnit) : "—"}
          />
          <Stat
            label="Equilibrio"
            value={canCalculate ? `${result.breakEvenUnits.toFixed(1)} ${unit}/mes` : "—"}
          />
        </div>

        {canCalculate && mode === "margin" && range && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Rango recomendado
            </p>
            <p className="font-display mt-1 text-lg font-bold tracking-tight text-cream">
              {ars.format(result.priceMin)} – {ars.format(result.priceMax)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-stone-400">
              Entre {range.floor}% y {range.cap}% de margen. Cerca del mínimo para
              ganar clientes; cerca del máximo cuando ya tengas demanda.
            </p>
          </div>
        )}

        {!canCalculate && (
          <p className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-stone-300">
            {emptyText}
          </p>
        )}

        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}
