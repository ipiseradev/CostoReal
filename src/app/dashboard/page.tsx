import type { Metadata } from "next";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Mi panel",
  description:
    "Tu panel Premium de CostoReal: productos guardados, edición, Excel y PDF.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <main className="flex min-h-full w-full flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-black text-white">
              $
            </span>
            CostoReal
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>
      <Dashboard />
      <footer className="mt-auto border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 text-center text-xs text-zinc-500">
          <p>© 2026 CostoReal · Los resultados son orientativos y no constituyen
          asesoramiento contable, impositivo ni legal.</p>
        </div>
      </footer>
    </main>
  );
}
