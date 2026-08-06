import Link from "next/link";
import PricingCalculator from "@/components/PricingCalculator";

const stats = [
  ["Ilimitado", "cálculos gratuitos"],
  ["$0", "para empezar"],
  ["30 seg", "hasta tu primer precio"],
  ["Pago único", "Premium de por vida"],
];

const rubros = [
  "Gastronomía",
  "Cosmética",
  "Indumentaria",
  "Artesanías",
  "Velas y aromas",
  "Servicios",
  "Cafeterías",
  "Dulces y repostería",
  "Decoración",
  "Belleza",
  "Bazar y hogar",
  "Accesorios",
];

const problems = [
  [
    "01",
    "Fijan precios a ojo",
    "Sin fórmula ni método, terminan copiando a la competencia en lugar de calcular.",
  ],
  [
    "02",
    "No suman su tiempo",
    "La mano de obra propia casi nunca entra en el cálculo del precio.",
  ],
  [
    "03",
    "Ignoran los costos fijos",
    "Alquiler, servicios y estructura quedan afuera y se comen el margen.",
  ],
];

const benefits = [
  {
    title: "Margen real, no engañoso",
    body: "El margen se calcula sobre el precio de venta, no sobre el costo. Sabés exactamente cuánto ganás por unidad.",
  },
  {
    title: "Costos fijos incluidos",
    body: "Alquiler, servicios y tu tiempo se prorratean por unidad. Dejás de cobrar por debajo de tu costo total.",
  },
  {
    title: "Punto de equilibrio",
    body: "Cuántas unidades tenés que vender al mes para no perder plata. Sabés cuándo tu negocio empieza a rendir.",
  },
];

const steps = [
  ["1", "Cargá tus costos", "Materia prima, mano de obra y costos fijos mensuales."],
  ["2", "Mirá tu resultado", "Precio sugerido, margen real y punto de equilibrio al instante."],
  ["3", "Desbloqueá todo", "Guardá productos, exportá a Excel y llevate la guía de precios."],
];

const freeFeatures = [
  "Cálculos ilimitados",
  "Margen real y punto de equilibrio",
  "Sin registro",
  "Resultado al instante",
];

const premiumFeatures = [
  "Productos ilimitados guardados en la nube",
  "Dashboard con búsqueda y categorías",
  "Exportación a Excel editable",
  "Reporte PDF imprimible por producto",
  "Guía de costeo y estrategia de precios",
  "Comparativa y simulador de escenarios",
  "Actualizaciones futuras incluidas",
];

const faqs = [
  {
    q: "¿Usar la calculadora es gratis?",
    a: "Sí, 100%. Calculás lo que quieras y el resultado se muestra al instante, sin registro y sin tarjeta.",
  },
  {
    q: "¿Qué incluye Premium?",
    a: "Productos ilimitados, plantilla Excel editable, reporte PDF por producto, la guía de costeo, comparativas y simulador de escenarios. Un solo pago de $9.900 y acceso de por vida.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago: tarjeta de crédito, débito o saldo. Al confirmar el pago se desbloquea todo al instante.",
  },
  {
    q: "¿El cálculo es exacto?",
    a: "El resultado es una estimación basada en los datos que cargás. No reemplaza el asesoramiento de un contador para decisiones fiscales o legales.",
  },
  {
    q: "¿Funciona en el celular?",
    a: "Sí, la calculadora y el panel de Premium están optimizados para móvil.",
  },
  {
    q: "¿Sirve para mi rubro?",
    a: "Sí: comida, indumentaria, cosmética, artesanías, servicios... cualquier producto o servicio que se venda por unidad.",
  },
];

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
      ✓
    </span>
  );
}

function Eyebrow({ children }: { children: string }) {  return (
    <span className="flex items-center justify-center gap-4">
      <span className="h-px w-10 bg-zinc-300" />
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
        {children}
      </span>
      <span className="h-px w-10 bg-zinc-300" />
    </span>
  );
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function ResultMockup() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-md lg:mt-0">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-zinc-900/[0.04] blur-2xl" />
      <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            CostoReal · Resultado
          </span>
        </div>
        <div className="mt-5 rounded-xl bg-zinc-900 p-5 text-white">
          <p className="text-xs font-medium text-zinc-400">
            Precio de venta sugerido
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">$15.333</p>
          <p className="mt-2 text-xs text-zinc-400">
            Margen real · 35% ($5.367)
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniResult label="Costo variable / u" value="$4.200" />
          <MiniResult label="Costo fijo / u" value="$5.000" />
          <MiniResult label="Costo total / u" value="$9.200" />
          <MiniResult label="Punto de equilibrio" value="19,3 u/mes" />
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-900" />
          <p className="text-xs font-medium text-zinc-600">
            Calculado al instante, sin registro
          </p>
        </div>
      </div>
      <span className="absolute -right-3 -top-4 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-lg sm:-right-5">
        ✓ Gratis para siempre
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex w-full flex-col bg-white text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-black text-white">
              $
            </span>
            CostoReal
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a
              href="#calculadora"
              className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100"
            >
              Calculadora
            </a>
            <a
              href="#problema"
              className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100"
            >
              El problema
            </a>
            <a
              href="#planes"
              className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100"
            >
              Planes
            </a>
            <a
              href="#faq"
              className="relative after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-zinc-900 after:transition-transform after:duration-300 hover:text-zinc-900 hover:after:scale-x-100"
            >
              FAQ
            </a>
          </nav>
          <a
            href="#calculadora"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 hover:shadow"
          >
            Calcular gratis
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px at 20% -10%, rgba(0,0,0,0.05), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-16 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-20 lg:pt-24">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
              La calculadora de precios de los emprendedores argentinos
            </span>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Calculá{" "}
              <span className="relative whitespace-nowrap italic">
                el precio justo
                <span className="absolute inset-x-0 -bottom-1.5 h-[3px] bg-zinc-900" />
              </span>{" "}
              de tus productos
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-zinc-600">
              Ingresá tus costos y conocé en segundos tu precio de venta con{" "}
              <strong className="font-semibold text-zinc-900">margen real</strong>,{" "}
              <strong className="font-semibold text-zinc-900">costos fijos</strong> y{" "}
              <strong className="font-semibold text-zinc-900">punto de equilibrio</strong>.
            </p>
            <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href="#calculadora"
                className="rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
              >
                Calcular mi precio gratis
              </a>
              <a
                href="#planes"
                className="rounded-xl border border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:border-zinc-900"
              >
                Ver planes
              </a>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-zinc-500 lg:justify-start">
              <span>✓ Sin registro</span>
              <span>✓ En pesos argentinos</span>
              <span>✓ 100% gratis</span>
            </div>
          </div>
          <ResultMockup />
        </div>
        <div className="relative overflow-hidden border-t border-zinc-200">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-400">
              Rubros que ya calculan con CostoReal
            </p>
            <div
              className="w-full overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
              }}
            >
              <div className="marquee-track flex w-max items-center gap-9 whitespace-nowrap py-1">
                {[...rubros, ...rubros].map((r, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-9 text-sm font-medium text-zinc-600"
                  >
                    {r}
                    <span
                      className="h-1 w-1 rounded-full bg-zinc-300"
                      aria-hidden="true"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-y-8 px-5 py-12 sm:grid-cols-4 sm:divide-x sm:divide-zinc-800">
          {stats.map(([value, label]) => (
            <div key={label} className="text-center sm:px-4">
              <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {value}
              </p>
              <p className="mt-1.5 text-sm text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="calculadora" className="scroll-mt-16 bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow>La calculadora</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Probala con tus números
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Ya viene cargada con un ejemplo. Modificá los valores y mirá el
              resultado al instante.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]">
            <PricingCalculator />
          </div>
        </div>
      </section>

      <section id="problema" className="scroll-mt-16 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Eyebrow>El problema</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              La mayoría de los emprendedores cobra mal
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              Sin saberlo, terminan cobrando por debajo de su costo. El resultado
              es trabajar más, ganar menos y desgastarse en el intento.
            </p>
            <blockquote className="mt-8 border-l-2 border-zinc-900 pl-5">
              <p className="font-display text-xl italic leading-relaxed text-zinc-900">
                &ldquo;Cobran a ojo, sin saber cuánto les cuesta producir.&rdquo;
              </p>
            </blockquote>
            <a
              href="#solucion"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition hover:gap-3"
            >
              Descubrí cómo lo resolvemos
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <div>
            <div className="flex flex-col">
              {problems.map(([n, t, b]) => (
                <div
                  key={n}
                  className="flex gap-6 border-t border-zinc-200 py-8 first:border-t-0 sm:gap-8"
                >
                  <span className="font-display text-3xl italic leading-none text-zinc-300 sm:text-4xl">
                    {n}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{t}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
                      {b}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="solucion" className="scroll-mt-16 border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>La solución</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              CostoReal ordena tus números en segundos
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              La misma fórmula que usan los contadores, sin planillas ni fórmulas
              complicadas.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-base font-bold text-white transition duration-300 group-hover:scale-105">
                  ✓
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              De cero al precio justo en 3 pasos
            </h2>
          </div>
          <div className="relative grid gap-5 md:grid-cols-3">
            <span
              className="absolute left-1/4 right-1/4 top-5 hidden border-t border-dashed border-zinc-300 md:block"
              aria-hidden="true"
            />
            {steps.map(([n, t, b]) => (
              <div
                key={n}
                className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <span className="absolute -right-2 -top-4 select-none text-[96px] font-black leading-none text-zinc-100">
                  {n}
                </span>
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-sm font-bold">
                  {n}
                </span>
                <h3 className="relative text-lg font-semibold tracking-tight">{t}</h3>
                <p className="relative text-sm leading-relaxed text-zinc-600">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-5 py-20 text-center sm:py-24">
          <Eyebrow>Beta abierta</Eyebrow>
          <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sumate a los primeros que cobran con datos
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600">
            CostoReal está en beta y cada cálculo nos ayuda a mejorarla. Probá
            tu precio en 30 segundos, contanos qué mejorar y quedate con acceso
            anticipado a Premium.
          </p>
          <a
            href="#calculadora"
            className="mt-2 rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
          >
            Probar gratis
          </a>
        </div>
      </section>

      <section id="planes" className="scroll-mt-16 bg-white">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>Planes</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Empezá gratis, escalá cuando quieras
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Un solo pago, acceso de por vida. Sin suscripciones ni letra chica.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Gratis
              </p>
              <p className="mt-6 text-5xl font-semibold tracking-tight">$0</p>
              <p className="mt-1 text-sm text-zinc-500">para siempre</p>
              <ul className="mt-8 flex flex-col gap-3.5 text-sm text-zinc-700">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#calculadora"
                className="mt-9 rounded-xl border border-zinc-300 px-5 py-3 text-center font-semibold text-zinc-900 transition hover:border-zinc-900"
              >
                Empezar gratis
              </a>
            </div>

            <div className="relative flex flex-col rounded-2xl bg-zinc-900 p-9 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
              <span className="absolute -top-3 left-9 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm">
                Más popular
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Premium
              </p>
              <p className="mt-6 text-5xl font-semibold tracking-tight">
                $9.900
                <span className="text-lg font-normal text-zinc-400"> ARS</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Pago único · Acceso de por vida
              </p>
              <ul className="mt-8 flex flex-col gap-3.5 text-sm text-zinc-300">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/premium"
                className="mt-9 rounded-xl bg-white px-5 py-3 text-center font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-md"
              >
                Quiero Premium ahora
              </Link>
              <p className="mt-4 text-center text-xs text-zinc-400">
                Pagás con Mercado Pago y se desbloquea al instante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-16 border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Resolvemos tus dudas
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-zinc-200 bg-white px-6 py-5 transition hover:border-zinc-400"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-base font-medium text-zinc-500 transition duration-200 group-open:rotate-45 group-open:border-zinc-900 group-open:text-zinc-900">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-zinc-900">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px at 50% 130%, rgba(255,255,255,0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-7 px-5 py-24 text-center">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Empezá a cobrar lo que valés
          </h2>
          <p className="text-lg text-zinc-400">
            Dos minutos de carga y vas a saber si hoy estás ganando plata de verdad.
          </p>
          <a
            href="#calculadora"
            className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-zinc-900 shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-lg"
          >
            Calcular mi precio gratis
          </a>
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-zinc-950">
                $
              </span>
              CostoReal
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              La calculadora de precios que ayuda a los emprendedores argentinos
              a cobrar lo que realmente valen.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Navegación
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-400">
              <li>
                <a href="#calculadora" className="transition hover:text-white">
                  Calculadora
                </a>
              </li>
              <li>
                <a href="#planes" className="transition hover:text-white">
                  Planes
                </a>
              </li>
              <li>
                <a href="#faq" className="transition hover:text-white">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Aviso
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Los resultados son orientativos y no constituyen asesoramiento
              contable, impositivo ni legal.
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-400">
              <li>
                <Link href="/terminos" className="transition hover:text-white">
                  Términos y privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-zinc-500 sm:flex-row">
            <p>© 2026 CostoReal · Hecho en Argentina</p>
            <p>Pagos seguros con Mercado Pago</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
