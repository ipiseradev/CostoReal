"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  calculatePricing,
  type PricingInput,
  type PricingResult,
} from "@/lib/pricing";
import { RUBROS } from "@/lib/categories";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export type PricingFormState = {
  name: string;
  mode: "margin" | "target";
  materials: string;
  laborHours: string;
  laborRate: string;
  packaging: string;
  otherVariable: string;
  fixedCosts: string;
  unitsMonth: string;
  taxes: string;
  marginPercent: string;
  marginFloor: string;
  marginCap: string;
  targetPrice: string;
};

const initialState: PricingFormState = {
  name: "",
  mode: "margin",
  materials: "1500",
  laborHours: "1",
  laborRate: "2500",
  packaging: "200",
  otherVariable: "0",
  fixedCosts: "200000",
  unitsMonth: "40",
  taxes: "5",
  marginPercent: "35",
  marginFloor: "20",
  marginCap: "50",
  targetPrice: "15000",
};

const STORAGE_KEY = "costoreal-calculator-v1";

function parseNum(s: string): number {
  const t = s.trim().replace(/\s/g, "");
  if (t === "" || t === "-" || t === ".") return 0;
  if (t.includes(",")) {
    return Number(t.replace(/\./g, "").replace(",", "."));
  }
  const parts = t.split(".");
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (last.length === 3) {
      return Number(t.replace(/\./g, ""));
    }
    return Number(t);
  }
  return Number(t);
}

const num = (s: string) => {
  const n = parseNum(s);
  return Number.isNaN(n) ? 0 : n;
};

export function formToInput(form: PricingFormState): PricingInput {
  return {
    name: form.name,
    mode: form.mode,
    materials: num(form.materials),
    laborHours: num(form.laborHours),
    laborRate: num(form.laborRate),
    packaging: num(form.packaging),
    otherVariable: num(form.otherVariable),
    fixedCosts: num(form.fixedCosts),
    unitsMonth: num(form.unitsMonth),
    taxes: num(form.taxes) / 100,
    marginPercent: num(form.marginPercent) / 100,
    marginFloor: num(form.marginFloor) / 100,
    marginCap: num(form.marginCap) / 100,
    targetPrice: num(form.targetPrice),
  };
}

export function inputToForm(input: PricingInput): PricingFormState {
  return {
    name: input.name,
    mode: input.mode,
    materials: String(input.materials),
    laborHours: String(input.laborHours),
    laborRate: String(input.laborRate),
    packaging: String(input.packaging),
    otherVariable: String(input.otherVariable),
    fixedCosts: String(input.fixedCosts),
    unitsMonth: String(input.unitsMonth),
    taxes: String(Number((input.taxes * 100).toFixed(4))),
    marginPercent: String(Number((input.marginPercent * 100).toFixed(4))),
    marginFloor: String(Number((input.marginFloor * 100).toFixed(4))),
    marginCap: String(Number((input.marginCap * 100).toFixed(4))),
    targetPrice: String(input.targetPrice),
  };
}

function Field({
  label,
  value,
  onChange,
  prefix = "$",
  suffix,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="flex items-center rounded-xl border border-line bg-cream transition focus-within:border-terra">
        {prefix && <span className="pl-3 text-sm text-mute">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={onChange}
          className="w-full rounded-xl bg-transparent px-2 py-2.5 text-right text-ink outline-none"
        />
        {suffix && <span className="pr-3 text-xs font-medium text-mute">{suffix}</span>}
      </div>
    </label>
  );
}

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <h2 className="mt-2 flex items-center gap-3 border-b border-line pb-3">
      <span className="font-display text-sm italic text-terra">{n}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mute">
        {children}
      </span>
    </h2>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-cream p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-mute">
        {label}
      </p>
      <p className="font-display mt-1.5 text-lg font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

export default function PricingCalculator({
  initial,
  persistKey = STORAGE_KEY,
  onSave,
  saving = false,
  saveLabel = "Guardar producto",
  category = "",
  onCategoryChange,
}: {
  initial?: Partial<PricingFormState>;
  persistKey?: string | null;
  onSave?: (form: PricingFormState, result: PricingResult) => void;
  saving?: boolean;
  saveLabel?: string;
  category?: string;
  onCategoryChange?: (category: string) => void;
}) {
  const isEdit = initial !== undefined;

  const [form, setForm] = useState<PricingFormState>(() => ({
    ...initialState,
    ...initial,
  }));
  const loadedRef = useRef(false);

  useEffect(() => {
    if (isEdit || !persistKey) return;
    try {
      const raw = window.localStorage.getItem(persistKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PricingFormState>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de localStorage, patrón legítimo
        setForm((f) => ({ ...f, ...saved }));
      }
    } catch {
      // sin persistencia, se usan los valores por defecto
    }
    loadedRef.current = true;
  }, [isEdit, persistKey]);

  useEffect(() => {
    if (isEdit || !persistKey) return;
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(persistKey, JSON.stringify(form));
    } catch {
      // localStorage no disponible
    }
  }, [form, isEdit, persistKey]);

  const set =
    (key: keyof PricingFormState) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const result = useMemo(() => {
    try {
      return calculatePricing(formToInput(form));
    } catch {
      return null;
    }
  }, [form]);

  const canCalculate = result !== null && result.totalCostUnit > 0;

  return (
    <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        {onSave && (
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-soft">
                Nombre del producto
              </span>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Ej.: Vela de soja 200g"
                className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-left text-ink outline-none transition placeholder:text-mute/70 focus:border-terra"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-soft">Rubro</span>
              <select
                value={category}
                onChange={(e) => onCategoryChange?.(e.target.value)}
                className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-left text-ink outline-none transition focus:border-terra"
              >
                <option value="">Elegí un rubro</option>
                {RUBROS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex rounded-full border border-line bg-parchment p-1">
          {(["margin", "target"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: m }))}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                form.mode === m
                  ? "bg-ink text-cream shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {m === "margin" ? "Por margen deseado" : "Por precio objetivo"}
            </button>
          ))}
        </div>

        <SectionTitle n="01">Costos variables · por unidad</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Materia prima"
            value={form.materials}
            onChange={set("materials")}
          />
          <Field
            label="Packaging"
            value={form.packaging}
            onChange={set("packaging")}
          />
          <Field
            label="Horas de mano de obra"
            prefix=""
            suffix="hs"
            value={form.laborHours}
            onChange={set("laborHours")}
          />
          <Field
            label="Valor de la hora"
            value={form.laborRate}
            onChange={set("laborRate")}
          />
          <Field
            label="Otros costos variables"
            value={form.otherVariable}
            onChange={set("otherVariable")}
          />
        </div>

        <SectionTitle n="02">Costos fijos · mensuales</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Total costos fijos / mes"
            value={form.fixedCosts}
            onChange={set("fixedCosts")}
          />
          <Field
            label="Unidades vendidas / mes"
            prefix=""
            suffix="u"
            value={form.unitsMonth}
            onChange={set("unitsMonth")}
          />
        </div>

        <SectionTitle n="03">Impuestos y margen</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Impuestos (IVA, IIBB...)"
            suffix="%"
            value={form.taxes}
            onChange={set("taxes")}
          />
          {form.mode === "margin" ? (
            <Field
              label="Margen deseado"
              suffix="%"
              value={form.marginPercent}
              onChange={set("marginPercent")}
            />
          ) : (
            <Field
              label="Precio objetivo"
              value={form.targetPrice}
              onChange={set("targetPrice")}
            />
          )}
          <Field
            label="Margen mínimo (rango)"
            suffix="%"
            value={form.marginFloor}
            onChange={set("marginFloor")}
          />
          <Field
            label="Margen máximo (rango)"
            suffix="%"
            value={form.marginCap}
            onChange={set("marginCap")}
          />
        </div>
      </form>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-cream">
          <div className="bg-grain pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <span className="inline-block h-1 w-12 rounded-full bg-ochre" />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-mute">
              Precio de venta sugerido
            </p>
            <p className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              {canCalculate ? ars.format(result.price) : "—"}
            </p>
            <p className="mt-3 text-sm text-stone-300">
              Margen:{" "}
              {canCalculate
                ? `${ars.format(result.marginAmount)} · ${result.marginPercent.toFixed(1)}%`
                : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResultCard
            label="Costo variable / u"
            value={canCalculate ? ars.format(result.variableCostUnit) : "—"}
          />
          <ResultCard
            label="Costo fijo / u"
            value={canCalculate ? ars.format(result.fixedCostUnit) : "—"}
          />
          <ResultCard
            label="Costo total / u"
            value={canCalculate ? ars.format(result.totalCostUnit) : "—"}
          />
          <ResultCard
            label="Punto de equilibrio"
            value={canCalculate ? `${result.breakEvenUnits.toFixed(1)} u/mes` : "—"}
          />
        </div>

        {canCalculate && form.mode === "margin" && (
          <div className="rounded-2xl border border-line bg-parchment p-4 text-sm text-ink-soft">
            Rango recomendado:{" "}
            <span className="font-display font-semibold text-ink">
              {ars.format(result.priceMin)} – {ars.format(result.priceMax)}
            </span>
          </div>
        )}

        {onSave ? (
          <button
            type="button"
            onClick={() => result && onSave(form, result)}
            disabled={saving || !canCalculate}
            className="rounded-full bg-terra px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-terra-dark hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {saving ? "Guardando…" : saveLabel}
          </button>
        ) : (
          <>
            <Link
              href="/premium"
              className="rounded-full bg-terra px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-terra-dark hover:shadow-md"
            >
              Guardar y desbloquear todo — $9.900
            </Link>
            <p className="text-center text-xs leading-relaxed text-ink-soft">
              La versión gratis calcula 1 producto. Con Premium guardás
              ilimitados, exportás a Excel y recibís tu guía PDF.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
