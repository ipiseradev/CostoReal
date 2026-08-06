"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  calculatePricing,
  type PricingInput,
  type PricingResult,
} from "@/lib/pricing";

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
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="flex items-center rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900">
        {prefix && <span className="pl-3 text-zinc-400">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={onChange}
          className="w-full rounded-lg bg-transparent px-2 py-2 text-right outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-zinc-400">{suffix}</span>}
      </div>
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export default function PricingCalculator({
  initial,
  persistKey = STORAGE_KEY,
  onSave,
  saving = false,
  saveLabel = "Guardar producto",
}: {
  initial?: Partial<PricingFormState>;
  persistKey?: string | null;
  onSave?: (form: PricingFormState, result: PricingResult) => void;
  saving?: boolean;
  saveLabel?: string;
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
    <div className="grid gap-8 p-4 sm:p-6 lg:grid-cols-2">
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        {onSave && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Nombre del producto
            </span>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="Ej.: Vela de soja 200g"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left outline-none transition focus:border-zinc-900"
            />
          </label>
        )}

        <div className="flex rounded-lg bg-zinc-100 p-1">
          {(["margin", "target"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: m }))}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                form.mode === m
                  ? "bg-white text-zinc-900 shadow"
                  : "text-zinc-500"
              }`}
            >
              {m === "margin" ? "Por margen deseado" : "Por precio objetivo"}
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Costos variables (por unidad)
        </h2>
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

        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Costos fijos (mensuales)
        </h2>
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

        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Impuestos y margen
        </h2>
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

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-zinc-900 p-6 text-white">
          <p className="text-sm font-medium text-zinc-300">
            Precio de venta sugerido
          </p>
          <p className="mt-1 text-4xl font-bold">
            {canCalculate ? ars.format(result.price) : "—"}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            Margen:{" "}
            {canCalculate
              ? `${ars.format(result.marginAmount)} (${result.marginPercent.toFixed(1)}%)`
              : "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResultCard
            label="Costo variable / unidad"
            value={canCalculate ? ars.format(result.variableCostUnit) : "—"}
          />
          <ResultCard
            label="Costo fijo / unidad"
            value={canCalculate ? ars.format(result.fixedCostUnit) : "—"}
          />
          <ResultCard
            label="Costo total / unidad"
            value={canCalculate ? ars.format(result.totalCostUnit) : "—"}
          />
          <ResultCard
            label="Punto de equilibrio"
            value={canCalculate ? `${result.breakEvenUnits.toFixed(1)} u/mes` : "—"}
          />
        </div>

        {canCalculate && form.mode === "margin" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Rango recomendado:{" "}
            <span className="font-semibold text-zinc-900">
              {ars.format(result.priceMin)} – {ars.format(result.priceMax)}
            </span>
          </div>
        )}

        {onSave ? (
          <button
            type="button"
            onClick={() => result && onSave(form, result)}
            disabled={saving || !canCalculate}
            className="rounded-xl bg-zinc-900 px-5 py-3.5 text-center font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando…" : saveLabel}
          </button>
        ) : (
          <>
            <Link
              href="/premium"
              className="rounded-xl bg-zinc-900 px-5 py-3.5 text-center font-semibold text-white transition hover:bg-zinc-700"
            >
              Guardar y desbloquear todo — $9.900
            </Link>
            <p className="text-center text-xs text-zinc-500">
              La versión gratis calcula 1 producto. Con Premium guardás
              ilimitados, exportás a Excel y recibís tu guía PDF.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
