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

const emptyState: PricingFormState = {
  name: "",
  mode: "margin",
  materials: "0",
  laborHours: "0",
  laborRate: "0",
  packaging: "0",
  otherVariable: "0",
  fixedCosts: "0",
  unitsMonth: "0",
  taxes: "0",
  marginPercent: "0",
  marginFloor: "0",
  marginCap: "0",
  targetPrice: "0",
};

const HINTS: Partial<Record<keyof PricingFormState, string>> = {
  materials: "Todo lo que se consume para hacer una unidad: tela, harina, cera, insumos…",
  packaging: "Envase, etiqueta, bolsa o cinta que acompaña cada producto.",
  laborHours: "Cuántas horas tuyas o de tu equipo se necesitan para hacer una unidad.",
  laborRate: "Cuánto vale tu hora de trabajo. Tu tiempo también es un costo.",
  otherVariable: "Otros costos que varían por unidad, como comisiones o envíos.",
  fixedCosts: "Alquiler, servicios, internet, herramientas… lo que pagás igual vendas o no.",
  unitsMonth: "Cuántas unidades esperás vender por mes. Sirve para repartir los costos fijos.",
  taxes: "IVA, IIBB u otros impuestos que se descuentan del precio final.",
  marginPercent: "Cuánto querés ganar por venta, como porcentaje del precio final.",
  targetPrice: "El precio al que querés vender. La calculadora te dice qué margen te deja.",
  marginFloor: "Piso de tu rango: con menos margen que este no te conviene vender.",
  marginCap: "Techo de tu rango: con más margen que este podés perder ventas.",
};

const NUMERIC_KEYS: (keyof PricingFormState)[] = [
  "materials",
  "laborHours",
  "laborRate",
  "packaging",
  "otherVariable",
  "fixedCosts",
  "unitsMonth",
  "taxes",
  "marginPercent",
  "marginFloor",
  "marginCap",
  "targetPrice",
];

function fieldErrors(
  form: PricingFormState
): Partial<Record<keyof PricingFormState, string>> {
  const errs: Partial<Record<keyof PricingFormState, string>> = {};
  for (const key of NUMERIC_KEYS) {
    const t = form[key].trim().replace(/\s/g, "");
    if (t === "" || t === "-" || t === ".") continue;
    const n = parseNum(form[key]);
    if (Number.isNaN(n)) errs[key] = "Número inválido";
    else if (n < 0) errs[key] = "No puede ser negativo";
  }
  if (!errs.marginFloor && !errs.marginCap && num(form.marginCap) < num(form.marginFloor)) {
    errs.marginCap = "Debe ser mayor o igual al mínimo";
  }
  return errs;
}

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
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  error?: string;
}) {
  const [showHint, setShowHint] = useState(false);
  const fieldId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className="relative flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
        {label}
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-label={`Ayuda: ${hint}`}
            aria-expanded={showHint}
            title={hint}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line bg-white text-[10px] font-bold text-mute transition hover:border-terra hover:text-terra"
          >
            ?
          </button>
        )}
      </span>
      <div
        className={`flex items-center rounded-xl border bg-cream transition focus-within:border-terra ${
          error ? "border-red-400" : "border-line"
        }`}
      >
        {prefix && <span className="pl-3 text-sm text-mute">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="w-full rounded-xl bg-transparent px-2 py-2.5 text-right text-ink outline-none"
        />
        {suffix && <span className="pr-3 text-xs font-medium text-mute">{suffix}</span>}
      </div>
      {hint && showHint && (
        <span
          role="tooltip"
          className="rounded-lg border border-line bg-white px-3 py-2 text-xs leading-relaxed text-ink-soft shadow-sm"
        >
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fieldId}-error`} className="text-xs font-medium text-red-700">
          {error}
        </span>
      )}
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

  const errors = useMemo(() => fieldErrors(form), [form]);

  const result = useMemo(() => {
    try {
      return calculatePricing(formToInput(form));
    } catch {
      return null;
    }
  }, [form]);

  const canCalculate = result !== null && result.totalCostUnit > 0;

  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: "-40% 0px -40% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showSticky = canCalculate && inView;

  return (
    <div ref={rootRef} className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, ...initialState }))}
              className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:border-terra hover:text-terra"
            >
              Cargar ejemplo
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, ...emptyState }))}
              className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:border-terra hover:text-terra"
            >
              Empezar de cero
            </button>
          </div>
        </div>

        <SectionTitle n="01">Costos variables · por unidad</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Materia prima"
            value={form.materials}
            onChange={set("materials")}
            hint={HINTS.materials}
            error={errors.materials}
          />
          <Field
            label="Packaging"
            value={form.packaging}
            onChange={set("packaging")}
            hint={HINTS.packaging}
            error={errors.packaging}
          />
          <Field
            label="Horas de mano de obra"
            prefix=""
            suffix="hs"
            value={form.laborHours}
            onChange={set("laborHours")}
            hint={HINTS.laborHours}
            error={errors.laborHours}
          />
          <Field
            label="Valor de la hora"
            value={form.laborRate}
            onChange={set("laborRate")}
            hint={HINTS.laborRate}
            error={errors.laborRate}
          />
          <Field
            label="Otros costos variables"
            value={form.otherVariable}
            onChange={set("otherVariable")}
            hint={HINTS.otherVariable}
            error={errors.otherVariable}
          />
        </div>

        <SectionTitle n="02">Costos fijos · mensuales</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Total costos fijos / mes"
            value={form.fixedCosts}
            onChange={set("fixedCosts")}
            hint={HINTS.fixedCosts}
            error={errors.fixedCosts}
          />
          <Field
            label="Unidades vendidas / mes"
            prefix=""
            suffix="u"
            value={form.unitsMonth}
            onChange={set("unitsMonth")}
            hint={HINTS.unitsMonth}
            error={errors.unitsMonth}
          />
        </div>

        <SectionTitle n="03">Impuestos y margen</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Impuestos (IVA, IIBB...)"
            suffix="%"
            value={form.taxes}
            onChange={set("taxes")}
            hint={HINTS.taxes}
            error={errors.taxes}
          />
          {form.mode === "margin" ? (
            <Field
              label="Margen deseado"
              suffix="%"
              value={form.marginPercent}
              onChange={set("marginPercent")}
              hint={HINTS.marginPercent}
              error={errors.marginPercent}
            />
          ) : (
            <Field
              label="Precio objetivo"
              value={form.targetPrice}
              onChange={set("targetPrice")}
              hint={HINTS.targetPrice}
              error={errors.targetPrice}
            />
          )}
          <Field
            label="Margen mínimo (rango)"
            suffix="%"
            value={form.marginFloor}
            onChange={set("marginFloor")}
            hint={HINTS.marginFloor}
            error={errors.marginFloor}
          />
          <Field
            label="Margen máximo (rango)"
            suffix="%"
            value={form.marginCap}
            onChange={set("marginCap")}
            hint={HINTS.marginCap}
            error={errors.marginCap}
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
          <div className="rounded-2xl border border-line bg-parchment p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-mute">
              Rango recomendado
            </p>
            <p className="font-display mt-1 text-lg font-semibold tracking-tight text-ink">
              {ars.format(result.priceMin)} – {ars.format(result.priceMax)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Entre {form.marginFloor}% y {form.marginCap}% de margen. Usá un
              precio cerca del mínimo para ganar clientes y cerca del máximo
              cuando ya tengas demanda.
            </p>
          </div>
        )}

        {canCalculate && (
          <p className="rounded-xl border border-line bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">Punto de equilibrio:</strong>{" "}
            necesitás vender al menos{" "}
            <strong className="font-semibold text-ink">
              {result.breakEvenUnits.toFixed(1)} unidades al mes
            </strong>{" "}
            para no perder plata.
          </p>
        )}

        {!canCalculate && (
          <p className="rounded-xl border border-line bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
            Cargá tus costos para ver tu precio y tu punto de equilibrio.
          </p>
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

      {showSticky && (
        <div className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-mute">Precio sugerido</p>
              <p className="font-display truncate text-lg font-semibold tracking-tight text-ink">
                {canCalculate ? ars.format(result.price) : "—"}
              </p>
            </div>
            {onSave ? (
              <button
                type="button"
                onClick={() => result && onSave(form, result)}
                disabled={saving || !canCalculate}
                className="shrink-0 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terra-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando…" : saveLabel}
              </button>
            ) : (
              <Link
                href="/premium"
                className="shrink-0 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-terra-dark"
              >
                Guardar y desbloquear
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
