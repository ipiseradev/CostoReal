import type { Metadata } from "next";
import Link from "next/link";
import CheckoutWallet from "@/components/CheckoutWallet";
import { PREMIUM_PRICE_ARS } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Premium · CostoReal",
  description:
    "Desbloqueá todos los beneficios de CostoReal: productos ilimitados, Excel, PDF y guía de precios. Pago único con Mercado Pago.",
};

const included = [
  "Productos ilimitados guardados en la nube",
  "Dashboard con búsqueda y categorías",
  "Exportación a Excel editable",
  "Reporte PDF imprimible por producto",
  "Guía de costeo y estrategia de precios",
  "Comparativa y simulador de escenarios",
  "Actualizaciones futuras incluidas",
];

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
      ✓
    </span>
  );
}

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;

  return (
    <main className="flex min-h-full w-full flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
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

      {result === "success" && (
        <div className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-5 py-6">
            <p className="text-sm font-semibold">✓ Pago aprobado</p>
            <p className="mt-1 text-sm text-zinc-600">
              En instantes vas a poder acceder a todos tus beneficios. Revisá tu
              email para activar la cuenta.
            </p>
          </div>
        </div>
      )}
      {result === "pending" && (
        <div className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-5 py-6">
            <p className="text-sm font-semibold">Pago pendiente</p>
            <p className="mt-1 text-sm text-zinc-600">
              Tu pago está en proceso. Cuando se acredite, se desbloquea todo al
              instante.
            </p>
          </div>
        </div>
      )}
      {result === "failure" && (
        <div className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-5 py-6">
            <p className="text-sm font-semibold">El pago no se completó</p>
            <p className="mt-1 text-sm text-zinc-600">
              Podés volver a intentarlo cuando quieras. No te cobramos nada.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            CostoReal Premium
          </span>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Desbloqueá todo el poder de tus números
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Un solo pago y accedés para siempre a todas las herramientas que te
            ayudan a cobrar lo que valés.
          </p>
          <ul className="mt-8 flex flex-col gap-3.5 text-sm text-zinc-700">
            {included.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)] lg:sticky lg:top-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Pago único
          </p>
          <p className="mt-4 text-5xl font-semibold tracking-tight">
            ${PREMIUM_PRICE_ARS.toLocaleString("es-AR")}
            <span className="text-lg font-normal text-zinc-400"> ARS</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Acceso de por vida, sin mensualidad
          </p>
          <div className="mt-8">
            <CheckoutWallet />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-zinc-100 pt-5 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-zinc-900" />
            Pagos procesados por Mercado Pago
          </div>
        </div>
      </div>
    </main>
  );
}
