import type { Metadata } from "next";
import Link from "next/link";
import CheckoutWallet from "@/components/CheckoutWallet";
import { PREMIUM_PRICE_ARS } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Desbloqueá todos los beneficios de CostoReal: productos ilimitados, Excel, PDF y guía de precios. Pago único con Mercado Pago.",
};

const included = [
  "Productos y servicios ilimitados en la nube",
  "Dashboard con búsqueda y categorías",
  "Exportación a Excel editable",
  "Reporte PDF imprimible por producto",
  "Guía de costeo y estrategia de precios",
  "Comparativa y simulador de escenarios",
  "Actualizaciones futuras incluidas",
];

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-parchment text-[10px] font-bold text-terra">
      ✓
    </span>
  );
}

function Banner({ result }: { result: string }) {
  if (result === "success") {
    return (
      <div className="border-b border-line bg-parchment">
        <div className="mx-auto w-full max-w-5xl px-5 py-6">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ochre text-xs font-bold text-ink">
              ✓
            </span>
            Pago aprobado
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Tu acceso Premium ya está activo. Entrá a tu panel con el email
            que usaste al pagar y empezá a guardar y exportar tus productos.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-terra-dark"
          >
            Ir a mi panel
          </Link>
        </div>
      </div>
    );
  }
  if (result === "pending") {
    return (
      <div className="border-b border-line bg-parchment">
        <div className="mx-auto w-full max-w-5xl px-5 py-6">
          <p className="font-display text-lg font-bold text-ink">
            Pago pendiente
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Tu pago está en proceso. Cuando se acredite, se desbloquea todo al
            instante.
          </p>
        </div>
      </div>
    );
  }
  if (result === "failure") {
    return (
      <div className="border-b border-line bg-parchment">
        <div className="mx-auto w-full max-w-5xl px-5 py-6">
          <p className="font-display text-lg font-bold text-ink">
            El pago no se completó
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Podés volver a intentarlo cuando quieras. No te cobramos nada.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;

  return (
    <main className="flex min-h-full w-full flex-col bg-cream text-ink">
      <div className="h-1 w-full bg-gradient-to-r from-terra via-ochre to-terra" />
      <header className="border-b border-line bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terra font-display text-sm font-bold text-cream">
              $
            </span>
            <span className="font-display text-lg">CostoReal</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <Banner result={result ?? ""} />

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-terra">
            CostoReal Premium
          </p>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Desbloqueá{" "}
            <span className="text-terra">todo el poder</span> de tus
            números
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Un solo pago y accedés para siempre a todas las herramientas que te
            ayudan a cobrar lo que valés.
          </p>
          <ul className="mt-8 flex flex-col gap-3.5 text-sm text-ink-soft">
            {included.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit overflow-hidden rounded-3xl border border-line bg-white p-8 shadow-[0_25px_60px_-30px_rgba(34,28,21,0.4)] lg:sticky lg:top-8">
          <span className="inline-block h-1 w-12 rounded-full bg-ochre" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-mute">
            Pago único
          </p>
          <p className="font-display mt-3 text-5xl font-bold tracking-tight">
            ${PREMIUM_PRICE_ARS.toLocaleString("es-AR")}
            <span className="text-lg font-normal not-italic text-mute"> ARS</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Acceso de por vida, sin mensualidad
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-parchment px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-terra">
            <span className="h-1.5 w-1.5 rounded-full bg-terra" aria-hidden="true" />
            Precio de lanzamiento
          </p>
          <p className="mt-2 text-xs text-mute">
            El precio sube cuando salimos de beta. Bloquealo hoy.
          </p>
          <div className="mt-8">
            <CheckoutWallet />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-line pt-5 text-xs text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-terra" />
            Pagos procesados por Mercado Pago
          </div>
          <p className="mt-4 text-center text-xs text-mute">
            Pago único · sin cargos ocultos · acceso de por vida
          </p>
        </div>
      </div>
    </main>
  );
}
