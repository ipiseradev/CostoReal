import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y privacidad",
  description:
    "Términos de uso y aviso de privacidad de CostoReal, la calculadora de precios para emprendedores argentinos.",
};

const sections: { title: string; body: string }[] = [
  {
    title: "1. Qué es CostoReal",
    body: "CostoReal es una calculadora de precios pensada para emprendedores argentinos. Ayuda a estimar un precio de venta sugerido a partir de los costos que el usuario carga.",
  },
  {
    title: "2. Resultados orientativos",
    body: "Los resultados que muestra la calculadora son estimaciones basadas en los datos ingresados por el usuario y no constituyen asesoramiento contable, impositivo ni legal. Cada usuario es responsable de verificar sus números y de consultar con un profesional para decisiones fiscales o legales.",
  },
  {
    title: "3. Plan gratuito y Premium",
    body: "El plan gratuito permite calcular precios sin límite y sin registro. Premium desbloquea funciones adicionales mediante un pago único de $9.900 ARS con acceso de por vida. Las funciones premium disponibles en cada momento pueden evolucionar durante la beta.",
  },
  {
    title: "4. Pagos",
    body: "Los pagos de Premium se procesan a través de Mercado Pago. No almacenamos datos de tarjetas ni medios de pago. El estado del pago se confirma mediante la notificación oficial de Mercado Pago.",
  },
  {
    title: "5. Datos que guardamos",
    body: "Guardamos el email usado al momento de pagar para asociar la compra, y los productos que el usuario guarda en su cuenta Premium. Estos datos se almacenan en una base de datos alojada en Neon (EE. UU.). No vendemos ni compartimos datos personales con terceros.",
  },
  {
    title: "6. Almacenamiento en tu navegador",
    body: "La calculadora guarda los valores que cargás en el almacenamiento local de tu navegador (localStorage) para que no se pierdan al recargar la página. Estos datos no se envían a nuestros servidores.",
  },
  {
    title: "7. Uso en beta",
    body: "La plataforma está en fase beta: puede haber errores, y funciones listadas pueden cambiar o no estar disponibles todavía. Agradecemos reportes de errores y sugerencias.",
  },
  {
    title: "8. Contacto",
    body: "Por consultas o bajas de datos, escribinos a costoreal.app@gmail.com.",
  },
];

export default function TerminosPage() {
  return (
    <main className="flex min-h-full w-full flex-col bg-cream text-ink">
      <div className="h-1 w-full bg-gradient-to-r from-terra via-ochre to-terra" />
      <header className="border-b border-line bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink font-display text-sm font-bold italic text-cream">
              $
            </span>
            <span className="font-display text-lg italic">CostoReal</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-terra">
          Legal
        </p>
        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Términos y privacidad
        </h1>
        <p className="mt-4 text-sm text-mute">Última actualización: agosto de 2026</p>
        <div className="mt-10 flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {s.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </section>
          ))}
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-mute sm:flex-row">
          <p>© 2026 CostoReal · Hecho en Argentina</p>
          <Link href="/" className="transition hover:text-ink">
            Volver al inicio
          </Link>
        </div>
      </footer>
    </main>
  );
}
