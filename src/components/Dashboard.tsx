"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PricingCalculator, {
  formToInput,
  inputToForm,
  type PricingFormState,
} from "@/components/PricingCalculator";
import { applyScenario, calculatePricing, type PricingResult, type Scenario } from "@/lib/pricing";
import type { SavedProduct } from "@/lib/exports";
import { RUBROS, DEFAULT_CATEGORY } from "@/lib/categories";

const TOKEN_KEY = "costoreal-premium-token";
const THEME_KEY = "costoreal-theme";
const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type View = "resumen" | "productos" | "editar" | "comparativa" | "metricas" | "guia";
type Editor = { product?: SavedProduct; category?: string };
type Toast = { kind: "ok" | "error"; text: string };
type WithResult = { product: SavedProduct; result: PricingResult | null };

const DEFAULT_SCENARIO: Scenario = { costFactor: 1, unitsFactor: 1, taxPoints: 0 };

function safeCalc(data: SavedProduct["data"]): PricingResult | null {
  try {
    return calculatePricing(data);
  } catch {
    return null;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

const IconHome = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Svg>
);
const IconBox = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13v8" />
  </Svg>
);
const IconPlus = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const IconDownload = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 17v3h16v-3" />
  </Svg>
);
const IconFile = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8Z" />
    <path d="M14 3v5h5" />
  </Svg>
);
const IconEdit = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 20h9" />
    <path d="m16.5 3.5 4 4L8 19l-4 1 1-4Z" />
  </Svg>
);
const IconCopy = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);
const IconTrash = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);
const IconLogout = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M15 12H3" />
    <path d="m6 9-3 3 3 3" />
    <path d="M9 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9" />
  </Svg>
);
const IconCheck = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);
const IconX = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
const IconScale = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 3v18" />
    <path d="M8 21h8" />
    <path d="m6 7 12-2" />
    <path d="M4 7l-2.5 5a3.2 3.2 0 0 0 5 0L4 7Z" />
    <path d="m20 5-2.5 5a3.2 3.2 0 0 0 5 0L20 5Z" />
  </Svg>
);
const IconChart = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 2 5-6" />
  </Svg>
);
const IconBook = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </Svg>
);
const IconMoon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Svg>
);
const IconSun = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </Svg>
);

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </p>
      <p className="font-display mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1.5 truncate text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [view, setView] = useState<View>("resumen");
  const [editor, setEditor] = useState<Editor>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recientes" | "precio-desc" | "precio-asc" | "nombre">(
    "recientes"
  );
  const [catFilter, setCatFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdfAll, setExportingPdfAll] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  function showToast(kind: Toast["kind"], text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }

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
    setEmail("");
    setProducts([]);
    setView("resumen");
    setToast(null);
  }

  function openNew() {
    setEditor({ category: "" });
    setView("editar");
  }

  function openEdit(p: SavedProduct) {
    setEditor({ product: p, category: p.category || DEFAULT_CATEGORY });
    setView("editar");
  }

  function openComparativa() {
    setSelected((current) => {
      if (current.length > 0 || products.length < 2) return current;
      return [products[0].id, products[1].id];
    });
    setView("comparativa");
  }

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setUnlocking(true);
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
      const newEmail = (data.email as string) ?? email;
      window.localStorage.setItem(TOKEN_KEY, newToken);
      setEmail(newEmail);
      setToken(newToken);
      const ok = await loadProducts(newToken);
      if (ok) setView("resumen");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo verificar tu acceso."
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function saveProduct(form: PricingFormState, result: PricingResult) {
    if (!token) return;
    const editing = editor.product;
    setSaving(true);
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
          category: editor.category?.trim() || DEFAULT_CATEGORY,
          input: formToInput(form),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar el producto.");
      }
      await loadProducts(token);
      setView("productos");
      setEditor({});
      showToast("ok", `Producto guardado · ${ars.format(result.price)}`);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: SavedProduct) {
    if (!token) return;
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) return;
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
      setSelected((s) => s.filter((id) => id !== product.id));
      showToast("ok", "Producto eliminado");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo eliminar el producto."
      );
    }
  }

  async function duplicateProduct(product: SavedProduct) {
    if (!token) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${product.name} (copia)`,
          category: product.category || DEFAULT_CATEGORY,
          input: product.data,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo duplicar el producto.");
      }
      await loadProducts(token);
      showToast("ok", "Producto duplicado");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo duplicar el producto."
      );
    }
  }

  async function exportExcel() {
    if (!token) return;
    setExporting(true);
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
      showToast("ok", "Excel generado");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo generar el Excel."
      );
    } finally {
      setExporting(false);
    }
  }

  async function exportPdfAll() {
    if (!token) return;
    setExportingPdfAll(true);
    try {
      const res = await fetch("/api/export/pdf-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo generar el PDF.");
      }
      download(await res.blob(), "costo-real-productos.pdf");
      showToast("ok", "PDF generado");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo generar el PDF."
      );
    } finally {
      setExportingPdfAll(false);
    }
  }

  async function exportPdf(product: SavedProduct) {
    if (!token) return;
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
      const filename = `costo-real-${product.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
      download(await res.blob(), filename);
      showToast("ok", "PDF generado");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "No se pudo generar el PDF."
      );
    }
  }

  const withResults = useMemo<WithResult[]>(
    () => products.map((p) => ({ product: p, result: safeCalc(p.data) })),
    [products]
  );

  const stats = useMemo(() => {
    const valid = withResults.filter((x) => x.result);
    const avgPrice =
      valid.length > 0
        ? valid.reduce((acc, x) => acc + (x.result?.price ?? 0), 0) / valid.length
        : 0;
    const top = valid.reduce(
      (best, x) => ((x.result?.price ?? 0) > (best?.result?.price ?? 0) ? x : best),
      undefined as WithResult | undefined
    );
    const avgBreakEven =
      valid.length > 0
        ? valid.reduce((acc, x) => acc + (x.result?.breakEvenUnits ?? 0), 0) / valid.length
        : 0;
    const revenue = valid.reduce(
      (acc, x) => acc + (x.result?.price ?? 0) * x.product.data.unitsMonth,
      0
    );
    const margin = valid.reduce(
      (acc, x) =>
        acc +
        ((x.result?.price ?? 0) - (x.result?.totalCostUnit ?? 0)) *
          x.product.data.unitsMonth,
      0
    );
    const avgMargin =
      valid.length > 0
        ? valid.reduce((acc, x) => acc + (x.result?.marginPercent ?? 0), 0) / valid.length
        : 0;
    return { count: products.length, avgPrice, top, avgBreakEven, revenue, margin, avgMargin };
  }, [withResults, products.length]);

  const categories = useMemo(() => {
    const present = Array.from(new Set(products.map((p) => p.category || DEFAULT_CATEGORY)));
    const ordered = RUBROS.filter((r) => present.includes(r));
    const rest = present.filter((c) => !(ordered as string[]).includes(c)).sort();
    return [...ordered, ...rest];
  }, [products]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      const c = p.category || DEFAULT_CATEGORY;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return Object.fromEntries(m) as Record<string, number>;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = withResults.filter(
      (x) =>
        (!q || x.product.name.toLowerCase().includes(q)) &&
        (catFilter === "Todos" || (x.product.category || DEFAULT_CATEGORY) === catFilter)
    );
    if (sort === "precio-desc") list = [...list].sort((a, b) => (b.result?.price ?? 0) - (a.result?.price ?? 0));
    if (sort === "precio-asc") list = [...list].sort((a, b) => (a.result?.price ?? 0) - (b.result?.price ?? 0));
    if (sort === "nombre") list = [...list].sort((a, b) => a.product.name.localeCompare(b.product.name, "es"));
    return list;
  }, [withResults, query, sort, catFilter]);

  const recent = useMemo(
    () =>
      [...withResults]
        .sort((a, b) => b.product.updatedAt.localeCompare(a.product.updatedAt))
        .slice(0, 3),
    [withResults]
  );

  const selectedItems = useMemo(
    () => withResults.filter((x) => selected.includes(x.product.id)),
    [withResults, selected]
  );

  const comparativa = useMemo(
    () =>
      selectedItems.map(({ product }) => {
        const base = safeCalc(product.data);
        const sc = safeCalc(applyScenario(product.data, scenario));
        return { product, base, sc };
      }),
    [selectedItems, scenario]
  );

  const scTotalRevenue = useMemo(
    () =>
      comparativa.reduce(
        (acc, x) =>
          acc +
          (x.sc?.price ?? 0) * (x.product.data.unitsMonth * scenario.unitsFactor),
        0
      ),
    [comparativa, scenario]
  );

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Cargando tu panel…
      </div>
    );
  }

  if (!token) {
    return (
      <div
        data-theme={theme}
        className="flex min-h-screen items-center bg-zinc-50 px-5 py-16"
      >
        <div className="mx-auto grid w-full max-w-3xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
              Mi panel · Premium
            </span>
            <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Tu panel, con un solo email
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Ingresá con el mismo email con el que pagaste Premium. El acceso
              queda guardado en este navegador y se desbloquea al instante.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm text-zinc-600">
              {[
                "Productos ilimitados en la nube",
                "Comparativa y simulador de escenarios",
                "Exportación a Excel y PDF",
                "Métricas y guía de costeo",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Iniciar sesión
              </p>
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                className="rounded-lg border border-zinc-200 p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
              </button>
            </div>
            <form onSubmit={handleUnlock} className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  Tu email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
                />
              </label>
              <button
                type="submit"
                disabled={unlocking || !email}
                className="rounded-xl bg-zinc-900 px-5 py-3.5 font-semibold text-white shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:bg-zinc-700 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {unlocking ? "Verificando…" : "Entrar a mi panel"}
              </button>
            </form>
            <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-500">
              ¿Todavía no pagaste Premium?{" "}
              <Link href="/premium" className="font-semibold text-zinc-900 hover:underline">
                Hacelo acá
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title =
    view === "resumen"
      ? "Resumen"
      : view === "productos"
        ? "Productos"
        : view === "comparativa"
          ? "Comparativa y simulador"
          : view === "metricas"
            ? "Métricas"
            : view === "guia"
              ? "Guía de costeo"
              : editor.product
                ? "Editar producto"
                : "Nuevo producto";

  const navItems: Array<{ view: View; label: string; icon: ReactNode; badge?: string }> = [
    { view: "resumen", label: "Resumen", icon: <IconHome /> },
    { view: "productos", label: "Productos", icon: <IconBox />, badge: products.length > 0 ? String(products.length) : undefined },
    { view: "comparativa", label: "Comparativa", icon: <IconScale /> },
    { view: "metricas", label: "Métricas", icon: <IconChart /> },
    { view: "guia", label: "Guía de costeo", icon: <IconBook /> },
  ];

  return (
    <div data-theme={theme} className="flex min-h-screen w-full bg-zinc-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-zinc-950">
              $
            </span>
            CostoReal
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Premium
            </span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavItem
              key={item.view}
              active={view === item.view}
              onClick={() =>
                item.view === "comparativa" ? openComparativa() : setView(item.view)
              }
              icon={item.icon}
              label={item.label}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-4 border-t border-zinc-800 p-5">
          <button
            type="button"
            onClick={exportExcel}
            disabled={exporting || products.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition enabled:hover:border-zinc-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconDownload className="h-4 w-4" />
            {exporting ? "Generando…" : "Exportar Excel"}
          </button>
          <button
            type="button"
            onClick={exportPdfAll}
            disabled={exportingPdfAll || products.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition enabled:hover:border-zinc-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconFile className="h-4 w-4" />
            {exportingPdfAll ? "Generando…" : "PDF de todos"}
          </button>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-zinc-400">
              {email}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
              >
                {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={clearSession}
                title="Cerrar sesión"
                className="shrink-0 p-1.5 text-zinc-400 transition hover:text-white"
              >
                <IconLogout className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Mi panel · Premium
                <span className="hidden rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-bold text-zinc-500 sm:inline">
                  {email}
                </span>
              </p>
              <h1 className="font-display mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
            </div>
            {view !== "editar" ? (
              <button
                type="button"
                onClick={openNew}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-md"
              >
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo producto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView("productos")}
                className="shrink-0 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
              >
                ← Volver
              </button>
            )}
          </div>
          {view !== "editar" && (
            <div className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-3 py-2 lg:hidden">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() =>
                    item.view === "comparativa" ? openComparativa() : setView(item.view)
                  }
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    view === item.view ? "bg-zinc-900 text-white" : "text-zinc-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8">
          {view === "resumen" && (
            <ResumenView
              stats={stats}
              recent={recent}
              ars={ars}
              onNew={openNew}
              onSeeAll={() => setView("productos")}
              onComparar={openComparativa}
              onMetricas={() => setView("metricas")}
              onGuia={() => setView("guia")}
              onEdit={openEdit}
              onDuplicate={duplicateProduct}
              onExport={exportExcel}
              exporting={exporting}
            />
          )}
          {view === "productos" && (
            <ProductosView
              items={filtered}
              total={products.length}
              categories={categories}
              catCounts={catCounts}
              catFilter={catFilter}
              onCatFilter={setCatFilter}
              query={query}
              onQuery={setQuery}
              sort={sort}
              onSort={setSort}
              ars={ars}
              onEdit={openEdit}
              onDelete={deleteProduct}
              onDuplicate={duplicateProduct}
              onPdf={exportPdf}
              onNew={openNew}
            />
          )}
          {view === "comparativa" && (
            <ComparativaView
              items={withResults}
              selected={selected}
              onToggle={(id) =>
                setSelected((s) =>
                  s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
                )
              }
              comparativa={comparativa}
              scenario={scenario}
              onScenario={setScenario}
              scTotalRevenue={scTotalRevenue}
              ars={ars}
              onNew={openNew}
            />
          )}
          {view === "metricas" && (
            <MetricasView items={withResults} stats={stats} ars={ars} onNew={openNew} />
          )}
          {view === "guia" && <GuiaView />}
          {view === "editar" && (
            <div className="mx-auto w-full max-w-6xl">
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
                <PricingCalculator
                  key={editor.product?.id ?? "nuevo"}
                  initial={editor.product ? inputToForm(editor.product.data) : undefined}
                  persistKey={editor.product ? null : "costoreal-premium-nuevo-producto"}
                  onSave={saveProduct}
                  saving={saving}
                  saveLabel={editor.product ? "Guardar cambios" : "Guardar producto"}
                  category={editor.category ?? ""}
                  onCategoryChange={(c) => setEditor((e) => ({ ...e, category: c }))}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${
            toast.kind === "ok" ? "bg-zinc-900" : "bg-red-600"
          }`}
        >
          {toast.kind === "ok" ? (
            <IconCheck className="h-4 w-4 shrink-0" />
          ) : (
            <IconX className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{toast.text}</span>
        </div>
      )}
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">
          {badge}
        </span>
      )}
    </button>
  );
}

function CategoryChip({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
      {value}
    </span>
  );
}

function ResumenView({
  stats,
  recent,
  ars,
  onNew,
  onSeeAll,
  onComparar,
  onMetricas,
  onGuia,
  onEdit,
  onDuplicate,
  onExport,
  exporting,
}: {
  stats: {
    count: number;
    avgPrice: number;
    top: WithResult | undefined;
    avgBreakEven: number;
    revenue: number;
    margin: number;
    avgMargin: number;
  };
  recent: WithResult[];
  ars: Intl.NumberFormat;
  onNew: () => void;
  onSeeAll: () => void;
  onComparar: () => void;
  onMetricas: () => void;
  onGuia: () => void;
  onEdit: (p: SavedProduct) => void;
  onDuplicate: (p: SavedProduct) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos guardados" value={String(stats.count)} hint="en la nube" />
        <StatCard label="Precio promedio" value={stats.count > 0 ? ars.format(stats.avgPrice) : "—"} hint="de venta sugerido" />
        <StatCard label="Ingreso proyectado" value={stats.count > 0 ? ars.format(stats.revenue) : "—"} hint="por mes, según tus unidades" />
        <StatCard label="Margen bruto / mes" value={stats.count > 0 ? ars.format(stats.margin) : "—"} hint={stats.count > 0 ? `promedio ${stats.avgMargin.toFixed(1)}%` : "todavía no cargaste productos"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Recientes
            </h2>
            <button
              type="button"
              onClick={onSeeAll}
              className="text-sm font-semibold text-zinc-900 transition hover:opacity-70"
            >
              Ver todos →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <IconBox className="h-7 w-7" />
              </span>
              <div>
                <p className="font-semibold text-zinc-800">Empezá por tu primer producto</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Cargá un cálculo y se guarda acá, listo para editar y exportar.
                </p>
              </div>
              <button
                type="button"
                onClick={onNew}
                className="mt-1 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700"
              >
                + Crear mi primer producto
              </button>
            </div>
          ) : (
            <ul className="mt-5 flex flex-col divide-y divide-zinc-100">
              {recent.map(({ product, result }) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="truncate font-semibold tracking-tight">{product.name}</span>
                      <CategoryChip value={product.category || DEFAULT_CATEGORY} />
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {result ? `Margen ${result.marginPercent.toFixed(1)}%` : "—"} · Actualizado{" "}
                      {new Date(product.updatedAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-display text-lg font-semibold">
                      {ars.format(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDuplicate(product)}
                      title="Duplicar"
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-zinc-500 transition hover:border-zinc-900 hover:text-zinc-900"
                    >
                      <IconCopy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
                    >
                      Editar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-3">
          <QuickAction
            icon={<IconPlus />}
            title="Nuevo producto"
            subtitle="Calculá y guardá en segundos"
            onClick={onNew}
            dark
          />
          <QuickAction
            icon={<IconScale />}
            title="Comparativa"
            subtitle="Simulá escenarios lado a lado"
            onClick={onComparar}
          />
          <QuickAction
            icon={<IconChart />}
            title="Métricas"
            subtitle="Ingresos, márgenes y gráficos"
            onClick={onMetricas}
          />
          <QuickAction
            icon={<IconBook />}
            title="Guía de costeo"
            subtitle="Estrategia para fijar precios"
            onClick={onGuia}
          />
          <QuickAction
            icon={<IconDownload />}
            title="Exportar Excel"
            subtitle={exporting ? "Generando…" : "Toda tu planilla editable"}
            onClick={onExport}
            disabled={exporting || stats.count === 0}
          />
        </aside>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  dark,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-zinc-300 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          dark ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-zinc-500">{subtitle}</span>
      </span>
    </button>
  );
}

function ProductosView({
  items,
  total,
  categories,
  catCounts,
  catFilter,
  onCatFilter,
  query,
  onQuery,
  sort,
  onSort,
  ars,
  onEdit,
  onDelete,
  onDuplicate,
  onPdf,
  onNew,
}: {
  items: WithResult[];
  total: number;
  categories: string[];
  catCounts: Record<string, number>;
  catFilter: string;
  onCatFilter: (c: string) => void;
  query: string;
  onQuery: (q: string) => void;
  sort: "recientes" | "precio-desc" | "precio-asc" | "nombre";
  onSort: (s: "recientes" | "precio-desc" | "precio-asc" | "nombre") => void;
  ars: Intl.NumberFormat;
  onEdit: (p: SavedProduct) => void;
  onDelete: (p: SavedProduct) => void;
  onDuplicate: (p: SavedProduct) => void;
  onPdf: (p: SavedProduct) => void;
  onNew: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <Svg className="h-4 w-4">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </Svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Ordenar
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as typeof sort)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-900"
          >
            <option value="recientes">Más recientes</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="precio-asc">Menor precio</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </label>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <CatChip
            label="Todos"
            count={total}
            active={catFilter === "Todos"}
            onClick={() => onCatFilter("Todos")}
          />
          {categories.map((c) => (
            <CatChip
              key={c}
              label={c}
              active={catFilter === c}
              onClick={() => onCatFilter(c)}
              count={catCounts[c] ?? 0}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-zinc-500">
        {total > 0 ? (
          <>
            {items.length} de {total} producto{total !== 1 ? "s" : ""}
          </>
        ) : (
          "Todavía no guardaste productos"
        )}
      </p>

      {total === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            Tu panel de productos está vacío
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Cargá tu primer cálculo y empezá a organizar tus precios.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700"
          >
            + Crear mi primer producto
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No hay productos que coincidan con el filtro
          </p>
          <button
            type="button"
            onClick={() => {
              onQuery("");
              onCatFilter("Todos");
            }}
            className="mt-4 text-sm font-semibold text-zinc-900 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map(({ product, result }) => (
            <li
              key={product.id}
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                    <IconBox className="h-4 w-4" />
                  </span>
                  <h3 className="truncate font-semibold tracking-tight">{product.name}</h3>
                  <CategoryChip value={product.category || DEFAULT_CATEGORY} />
                </div>
                <p className="mt-1.5 pl-12 text-sm text-zinc-500">
                  {result
                    ? `Margen ${result.marginPercent.toFixed(1)}% · Punto de equilibrio ${result.breakEvenUnits.toFixed(1)} u/mes`
                    : "—"}{" "}
                  · Actualizado {new Date(product.updatedAt).toLocaleDateString("es-AR")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <div className="text-left sm:text-right">
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {ars.format(product.price)}
                  </p>
                  <p className="text-xs text-zinc-500">precio sugerido</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
                  >
                    <IconEdit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onPdf(product)}
                    title="Descargar PDF"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
                  >
                    <IconFile className="h-3.5 w-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(product)}
                    title="Duplicar"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:border-zinc-900"
                  >
                    <IconCopy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    title="Eliminar"
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span className="ml-1.5 opacity-60">{count}</span>
      )}
    </button>
  );
}

function ScenarioSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className="font-semibold text-zinc-900">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-zinc-900"
      />
    </label>
  );
}

function ComparativaView({
  items,
  selected,
  onToggle,
  comparativa,
  scenario,
  onScenario,
  scTotalRevenue,
  ars,
  onNew,
}: {
  items: WithResult[];
  selected: string[];
  onToggle: (id: string) => void;
  comparativa: { product: SavedProduct; base: PricingResult | null; sc: PricingResult | null }[];
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  scTotalRevenue: number;
  ars: Intl.NumberFormat;
  onNew: () => void;
}) {
  const isSimulating =
    scenario.costFactor !== 1 || scenario.unitsFactor !== 1 || scenario.taxPoints !== 0;

  if (items.length < 2) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <IconScale className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm font-medium text-zinc-700">
            Necesitás al menos dos productos para comparar
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Guardá un par de cálculos y vas a poder compararlos lado a lado y
            simular escenarios.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700"
          >
            + Crear mi primer producto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Elegí productos para comparar
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Marcá al menos dos. Seleccionados: {selected.length}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ product, result }) => {
            const isSel = selected.includes(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onToggle(product.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  isSel
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    isSel ? "border-white/50" : "border-zinc-300"
                  }`}
                >
                  {isSel && <IconCheck className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-semibold ${isSel ? "text-white" : "text-zinc-900"}`}>
                    {product.name}
                  </span>
                  <span className={`block text-xs ${isSel ? "text-zinc-300" : "text-zinc-500"}`}>
                    {ars.format(result?.price ?? product.price)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Simulador de escenarios
          </h2>
          {isSimulating && (
            <button
              type="button"
              onClick={() => onScenario(DEFAULT_SCENARIO)}
              className="text-xs font-semibold text-zinc-900 hover:underline"
            >
              Restablecer
            </button>
          )}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <ScenarioSlider
            label="Costo de insumos"
            value={scenario.costFactor}
            min={0.5}
            max={2}
            step={0.05}
            display={`× ${scenario.costFactor.toFixed(2)}`}
            onChange={(v) => onScenario({ ...scenario, costFactor: v })}
          />
          <ScenarioSlider
            label="Unidades vendidas"
            value={scenario.unitsFactor}
            min={0.5}
            max={3}
            step={0.1}
            display={`× ${scenario.unitsFactor.toFixed(1)}`}
            onChange={(v) => onScenario({ ...scenario, unitsFactor: v })}
          />
          <ScenarioSlider
            label="Impuestos extra"
            value={scenario.taxPoints}
            min={0}
            max={30}
            step={1}
            display={`+${scenario.taxPoints} pts`}
            onChange={(v) => onScenario({ ...scenario, taxPoints: v })}
          />
        </div>
        {isSimulating && (
          <p className="mt-5 rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700">
            <strong>Ingreso mensual proyectado en este escenario:</strong>{" "}
            <span className="font-display text-lg font-semibold">{ars.format(scTotalRevenue)}</span>
          </p>
        )}
      </section>

      {comparativa.length < 2 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            Elegí al menos dos productos para ver la comparación
          </p>
        </div>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                  <th className="px-5 py-4 font-semibold">Producto</th>
                  <th className="px-3 py-4 text-right font-semibold">Precio actual</th>
                  <th className="px-3 py-4 text-right font-semibold">Precio escenario</th>
                  <th className="px-3 py-4 text-right font-semibold">Margen actual</th>
                  <th className="px-3 py-4 text-right font-semibold">Margen escenario</th>
                  <th className="px-3 py-4 text-right font-semibold">Eq. actual</th>
                  <th className="px-3 py-4 text-right font-semibold">Eq. escenario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {comparativa.map(({ product, base, sc }) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-semibold">
                      <span className="block truncate">{product.name}</span>
                      <span className="text-xs font-normal text-zinc-500">
                        {product.category || DEFAULT_CATEGORY}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right font-display font-semibold">
                      {base ? ars.format(base.price) : "—"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {sc ? (
                        <span className="font-display font-semibold text-zinc-900">
                          {ars.format(sc.price)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {base ? `${base.marginPercent.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {sc ? `${sc.marginPercent.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {base ? `${base.breakEvenUnits.toFixed(0)} u` : "—"}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {sc ? `${sc.breakEvenUnits.toFixed(0)} u` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function RevenueChart({ items, ars }: { items: WithResult[]; ars: Intl.NumberFormat }) {
  const rows = items
    .map(({ product, result }) => ({
      id: product.id,
      name: product.name,
      revenue: (result?.price ?? 0) * product.data.unitsMonth,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  const barMax = 320;
  const W = 560;
  const H = rows.length * 46 + 12;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ingreso proyectado por producto">
      {rows.map((r, i) => {
        const y = i * 46 + 6;
        const bw = Math.max(3, (r.revenue / max) * barMax);
        return (
          <g key={r.id}>
            <text x={0} y={y + 13} fontSize={11} className="fill-zinc-500">
              {truncate(r.name, 26)}
            </text>
            <rect x={0} y={y + 20} width={bw} height={13} rx={3} className="fill-zinc-900" />
            <text x={bw + 8} y={y + 31} fontSize={11} fontWeight={600} className="fill-zinc-900">
              {ars.format(r.revenue)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MetricasView({
  items,
  stats,
  ars,
  onNew,
}: {
  items: WithResult[];
  stats: {
    count: number;
    avgPrice: number;
    avgBreakEven: number;
    revenue: number;
    margin: number;
    avgMargin: number;
  };
  ars: Intl.NumberFormat;
  onNew: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <IconChart className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm font-medium text-zinc-700">
            Guardá productos para ver tus métricas
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Acá vas a ver ingresos proyectados, márgenes y puntos de equilibrio.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-6 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700"
          >
            + Crear mi primer producto
          </button>
        </div>
      </div>
    );
  }

  const valid = items.filter((x) => x.result);
  const costosTotales = valid.reduce((acc, x) => acc + x.product.data.fixedCosts, 0);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingreso proyectado" value={ars.format(stats.revenue)} hint="por mes, a tus unidades actuales" />
        <StatCard label="Margen bruto / mes" value={ars.format(stats.margin)} hint={`promedio ${stats.avgMargin.toFixed(1)}% sobre el precio`} />
        <StatCard label="Costos fijos / mes" value={ars.format(costosTotales)} hint="suma de todos tus productos" />
        <StatCard label="Precio promedio" value={ars.format(stats.avgPrice)} hint={`equilibrio promedio ${stats.avgBreakEven.toFixed(1)} u/mes`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Ingreso mensual por producto
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Precio sugerido × unidades que planificaste vender al mes.
          </p>
          <div className="mt-6">
            <RevenueChart items={items} ars={ars} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Top por precio
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {valid
                .sort((a, b) => (b.result?.price ?? 0) - (a.result?.price ?? 0))
                .slice(0, 5)
                .map(({ product, result }) => (
                  <li key={product.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-zinc-600">{product.name}</span>
                    <span className="font-display shrink-0 text-sm font-semibold">
                      {ars.format(result?.price ?? product.price)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Margen por producto
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {valid
                .sort((a, b) => (b.result?.marginPercent ?? 0) - (a.result?.marginPercent ?? 0))
                .slice(0, 5)
                .map(({ product, result }) => (
                  <li key={product.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-zinc-600">{product.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-zinc-900">
                      {result ? `${result.marginPercent.toFixed(1)}%` : "—"}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function GuiaView() {
  const rubros: Array<[string, string]> = [
    ["Gastronomía", "55 – 70% sobre el costo de insumos"],
    ["Cosmética y belleza", "60 – 80%"],
    ["Indumentaria", "50 – 70%"],
    ["Artesanías", "50 – 70%"],
    ["Velas y aromas", "55 – 70%"],
    ["Servicios", "70% o más (tu tiempo es el costo)"],
    ["Dulces y repostería", "60 – 75%"],
    ["Cafeterías", "60 – 75%"],
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          La regla de oro
        </h2>
        <p className="mt-4 text-lg leading-relaxed">
          El precio tiene que cubrir <strong>todos tus costos</strong> (los
          variables de cada unidad más una parte de los fijos) y dejarte una
          ganancia. Si el margen real que calcula CostoReal queda muy bajo,
          estás financiando tu negocio con tu propio bolsillo.
        </p>
        <div className="mt-6 rounded-xl bg-zinc-100 p-5 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">La fórmula</p>
          <p className="mt-1">
            Precio = Costo unitario total ÷ (1 − margen deseado)
          </p>
          <p className="mt-1">
            Ejemplo: costo de $5.000 y margen del 40% → $5.000 ÷ 0,6 ={" "}
            <strong>$8.333</strong>.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Márgenes de referencia por rubro
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Porcentajes de margen sobre el precio de venta que suelen funcionar en
          Argentina para productos hechos a mano o de baja escala.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {rubros.map(([rubro, margen]) => (
            <div
              key={rubro}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3"
            >
              <span className="text-sm font-semibold">{rubro}</span>
              <span className="text-sm text-zinc-500">{margen}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Bajar el punto de equilibrio
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-700">
            {[
              "Reducí costos fijos (alquiler, suscripciones, gastos hormiga).",
              "Subí el ticket promedio con versiones más grandes o kits.",
              "Amplía la mezcla: un producto con mucho margen sostiene al resto.",
              "Aumentá la cantidad vendida aunque bajes un poco el precio.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Impuestos
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-700">
            {[
              "Si estás en Monotributo, la cuota es un costo fijo mensual.",
              "Percepciones y retenciones pueden sacarte un % al cobrar.",
              "En el campo «Impuestos» cargá el % del precio que se va en tributos.",
              "Si sos Responsable Inscripto, sumá el IVA al precio final.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-900">
                  !
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Inflación y revisión
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-700">
            {[
              "En contexto inflacionario, revisá precios cada 2 a 4 semanas.",
              "Preciá sobre el costo de reposición, no sobre el histórico.",
              "Usá la comparativa para ver cómo te afecta una suba de insumos.",
              "Ajustá el costo de tu hora de trabajo: también se devalúa.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Señales de alerta
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-700">
            {[
              "Margen real menor al 30% sobre el precio final.",
              "Punto de equilibrio por encima de lo que realmente vendés.",
              "El «precio más alto» del mercado que está mucho abajo del tuyo.",
              "El precio sugerido no cubre la reposición de la materia prima.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700">
                  !
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
