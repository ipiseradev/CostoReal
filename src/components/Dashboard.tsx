"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PricingCalculator, {
  formToInput,
  inputToForm,
  type PricingFormState,
} from "@/components/PricingCalculator";
import type { PricingResult } from "@/lib/pricing";
import type { SavedProduct } from "@/lib/exports";

const TOKEN_KEY = "costoreal-premium-token";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type View = { type: "list" } | { type: "edit"; product?: SavedProduct };

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [view, setView] = useState<View>({ type: "list" });
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function loadProducts(currentToken: string): Promise<boolean> {
    try {
      const res = await fetch("/api/products", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.status === 401) {
        clearSession();
        return false;
      }
      if (!res.ok) return false;
      const data = (await res.json()) as { products: SavedProduct[] };
      setProducts(data.products);
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const stored = window.localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const ok = await loadProducts(stored);
        if (cancelled) return;
        if (ok) setToken(stored);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSession() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProducts([]);
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setMessage(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo verificar tu acceso.");
      }
      const newToken = data.token as string;
      window.localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      await loadProducts(newToken);
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo verificar tu acceso.",
      });
    } finally {
      setUnlocking(false);
    }
  }

  async function saveProduct(form: PricingFormState, result: PricingResult) {
    if (!token) return;
    const editing = view.type === "edit" ? view.product : undefined;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editing?.id,
          name: form.name,
          input: formToInput(form),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar el producto.");
      }
      await loadProducts(token);
      setView({ type: "list" });
      setMessage({
        kind: "ok",
        text: `Producto guardado · precio sugerido ${ars.format(result.price)}`,
      });
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar el producto.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: SavedProduct) {
    if (!token) return;
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
    setMessage(null);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "No se pudo eliminar el producto.");
      }
      setProducts((p) => p.filter((x) => x.id !== product.id));
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo eliminar el producto.",
      });
    }
  }

  async function exportExcel() {
    if (!token) return;
    setExporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo generar el Excel.");
      }
      download(await res.blob(), "costo-real-productos.xlsx");
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo generar el Excel.",
      });
    } finally {
      setExporting(false);
    }
  }

  async function exportPdf(product: SavedProduct) {
    if (!token) return;
    setMessage(null);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo generar el PDF.");
      }
      download(await res.blob(), `costo-real-${product.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo generar el PDF.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">
        Cargando tu panel…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-16 sm:py-24">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)]">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Mi panel · Premium
          </span>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            Ingresá con tu email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Usá el mismo email con el que pagaste Premium. El acceso se
            desbloquea al instante y queda guardado en este navegador.
          </p>
          <form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
            />
            <button
              type="submit"
              disabled={unlocking || !email}
              className="rounded-xl bg-zinc-900 px-5 py-3.5 font-semibold text-white shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:bg-zinc-700 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {unlocking ? "Verificando…" : "Entrar a mi panel"}
            </button>
          </form>
          {message && message.kind === "error" && (
            <p className="mt-4 text-sm text-red-600">{message.text}</p>
          )}
          <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-500">
            ¿Todavía no pagaste Premium?{" "}
            <Link href="/premium" className="font-semibold text-zinc-900 hover:underline">
              Hacelo acá
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (view.type === "edit") {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {view.product ? "Editar producto" : "Nuevo producto"}
          </h1>
          <button
            type="button"
            onClick={() => setView({ type: "list" })}
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            ← Volver a mis productos
          </button>
        </div>
        {message && (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
          <PricingCalculator
            key={view.product?.id ?? "nuevo"}
            initial={view.product ? inputToForm(view.product.data) : undefined}
            persistKey={view.product ? null : "costoreal-premium-nuevo-producto"}
            onSave={saveProduct}
            saving={saving}
            saveLabel={view.product ? "Guardar cambios" : "Guardar producto"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Mi panel · Premium
          </span>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tus productos
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Guardás ilimitados en la nube, los editás cuando quieras y los
            exportás a Excel o PDF.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-zinc-500">
            Sesión: <span className="font-medium text-zinc-900">{email || "—"}</span>
          </span>
          <button
            type="button"
            onClick={clearSession}
            className="self-start text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            Salir
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            message.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-zinc-50 text-zinc-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setView({ type: "edit" });
          }}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-center font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
        >
          + Nuevo producto
        </button>
        <button
          type="button"
          onClick={exportExcel}
          disabled={exporting || products.length === 0}
          className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-center font-semibold text-zinc-900 transition enabled:hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Generando…" : "Exportar todo a Excel"}
        </button>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            Todavía no guardaste ningún producto
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Cargá tu primer cálculo y se guarda acá, listo para editar y
            exportar.
          </p>
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setView({ type: "edit" });
            }}
            className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700"
          >
            Crear mi primer producto
          </button>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {products.map((p) => {
            const label = p.data.mode === "margin" ? "Margen deseado" : "Precio objetivo";
            const value = p.data.mode === "margin" ? `${(p.data.marginPercent * 100).toFixed(0)}%` : ars.format(p.data.targetPrice);
            return (
              <li
                key={p.id}
                className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight">
                    {p.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {label}: <span className="font-medium text-zinc-700">{value}</span> ·
                    Actualizado{" "}
                    {new Date(p.updatedAt).toLocaleDateString("es-AR")}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">
                    {ars.format(p.price)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage(null);
                      setView({ type: "edit", product: p });
                    }}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPdf(p)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(p)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
