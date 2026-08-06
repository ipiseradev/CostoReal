"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PricingCalculator, {
  formToInput,
  inputToForm,
  type PricingFormState,
} from "@/components/PricingCalculator";
import { calculatePricing, type PricingResult } from "@/lib/pricing";
import type { SavedProduct } from "@/lib/exports";

const TOKEN_KEY = "costoreal-premium-token";
const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type View = "resumen" | "productos" | "editar";
type Editor = { product?: SavedProduct };
type Toast = { kind: "ok" | "error"; text: string };

function safeCalc(data: SavedProduct["data"]): PricingResult | null {
  try {
    return calculatePricing(data);
  } catch {
    return null;
  }
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
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const withResults = useMemo(
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
      undefined as (typeof valid)[number] | undefined
    );
    const avgBreakEven =
      valid.length > 0
        ? valid.reduce((acc, x) => acc + (x.result?.breakEvenUnits ?? 0), 0) / valid.length
        : 0;
    return { count: products.length, avgPrice, top, avgBreakEven };
  }, [withResults, products.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = withResults.filter((x) => !q || x.product.name.toLowerCase().includes(q));
    if (sort === "precio-desc") list = [...list].sort((a, b) => (b.result?.price ?? 0) - (a.result?.price ?? 0));
    if (sort === "precio-asc") list = [...list].sort((a, b) => (a.result?.price ?? 0) - (b.result?.price ?? 0));
    if (sort === "nombre") list = [...list].sort((a, b) => a.product.name.localeCompare(b.product.name, "es"));
    return list;
  }, [withResults, query, sort]);

  const recent = useMemo(
    () =>
      [...withResults]
        .sort((a, b) => b.product.updatedAt.localeCompare(a.product.updatedAt))
        .slice(0, 3),
    [withResults]
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
      <div className="flex min-h-screen items-center bg-zinc-50 px-5 py-16">
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
                "Exportación a Excel y PDF",
                "Edición y duplicado al instante",
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Iniciar sesión
            </p>
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
        : editor.product
          ? "Editar producto"
          : "Nuevo producto";

  return (
    <div className="flex min-h-screen w-full bg-zinc-50">
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
          <NavItem
            active={view === "resumen"}
            onClick={() => setView("resumen")}
            icon={<IconHome />}
            label="Resumen"
          />
          <NavItem
            active={view === "productos"}
            onClick={() => setView("productos")}
            icon={<IconBox />}
            label="Productos"
            badge={products.length > 0 ? String(products.length) : undefined}
          />
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
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs text-zinc-400">
              {email}
            </p>
            <button
              type="button"
              onClick={clearSession}
              title="Cerrar sesión"
              className="shrink-0 text-zinc-400 transition hover:text-white"
            >
              <IconLogout className="h-4 w-4" />
            </button>
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
                onClick={() => {
                  setEditor({});
                  setView("editar");
                }}
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
            <div className="flex gap-1 border-t border-zinc-100 px-3 py-2 lg:hidden">
              <MobileTab active={view === "resumen"} onClick={() => setView("resumen")}>
                Resumen
              </MobileTab>
              <MobileTab active={view === "productos"} onClick={() => setView("productos")}>
                Productos
              </MobileTab>
            </div>
          )}
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8">
          {view === "resumen" && (
            <ResumenView
              stats={stats}
              recent={recent}
              ars={ars}
              onNew={() => {
                setEditor({});
                setView("editar");
              }}
              onSeeAll={() => setView("productos")}
              onEdit={(p) => {
                setEditor({ product: p });
                setView("editar");
              }}
              onExport={exportExcel}
              exporting={exporting}
            />
          )}
          {view === "productos" && (
            <ProductosView
              items={filtered}
              total={products.length}
              query={query}
              onQuery={setQuery}
              sort={sort}
              onSort={setSort}
              ars={ars}
              onEdit={(p) => {
                setEditor({ product: p });
                setView("editar");
              }}
              onDelete={deleteProduct}
              onDuplicate={duplicateProduct}
              onPdf={exportPdf}
              onNew={() => {
                setEditor({});
                setView("editar");
              }}
            />
          )}
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

function MobileTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-zinc-900 text-white" : "text-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

function ResumenView({
  stats,
  recent,
  ars,
  onNew,
  onSeeAll,
  onEdit,
  onExport,
  exporting,
}: {
  stats: {
    count: number;
    avgPrice: number;
    top: { product: SavedProduct; result: PricingResult | null } | undefined;
    avgBreakEven: number;
  };
  recent: { product: SavedProduct; result: PricingResult | null }[];
  ars: Intl.NumberFormat;
  onNew: () => void;
  onSeeAll: () => void;
  onEdit: (p: SavedProduct) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos guardados" value={String(stats.count)} hint="en la nube" />
        <StatCard label="Precio promedio" value={stats.count > 0 ? ars.format(stats.avgPrice) : "—"} hint="de venta sugerido" />
        <StatCard
          label="Precio más alto"
          value={stats.top ? ars.format(stats.top.result?.price ?? 0) : "—"}
          hint={stats.top ? stats.top.product.name : "todavía no cargaste productos"}
        />
        <StatCard
          label="Punto de equilibrio"
          value={stats.count > 0 ? `${stats.avgBreakEven.toFixed(1)} u/mes` : "—"}
          hint="promedio para no perder plata"
        />
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
                    <p className="truncate font-semibold tracking-tight">{product.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {result ? `Margen ${result.marginPercent.toFixed(1)}%` : "—"} · Actualizado{" "}
                      {new Date(product.updatedAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-display text-lg font-semibold">
                      {ars.format(product.price)}
                    </span>
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

        <aside className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <IconPlus />
            </span>
            <span>
              <span className="block font-semibold">Nuevo producto</span>
              <span className="mt-0.5 block text-sm text-zinc-500">
                Calculá y guardá en segundos
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || stats.count === 0}
            className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-zinc-300 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
              <IconDownload />
            </span>
            <span>
              <span className="block font-semibold">Exportar Excel</span>
              <span className="mt-0.5 block text-sm text-zinc-500">
                {exporting ? "Generando…" : "Toda tu planilla editable"}
              </span>
            </span>
          </button>
        </aside>
      </div>
    </div>
  );
}

function ProductosView({
  items,
  total,
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
  items: { product: SavedProduct; result: PricingResult | null }[];
  total: number;
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
            No hay productos que coincidan con «{query}»
          </p>
          <button
            type="button"
            onClick={() => onQuery("")}
            className="mt-4 text-sm font-semibold text-zinc-900 hover:underline"
          >
            Limpiar búsqueda
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
