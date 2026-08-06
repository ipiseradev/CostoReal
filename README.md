# CostoReal

Calculadora de precios para emprendedores argentinos. Ingresá tus costos y conocé en segundos el precio de venta justo de tus productos: margen real, costos fijos, impuestos y punto de equilibrio.

Modelo **freemium**: la calculadora es gratis para siempre, y con un pago único de **$9.900 ARS** se desbloquea la versión Premium (productos ilimitados, exportación a Excel, reportes PDF y guía de costeo).

## Características

| | Gratis | Premium |
|---|---|---|
| Cálculo de precio (ilimitado) | Sí | Sí |
| Margen real y punto de equilibrio | Sí | Sí |
| Sin registro | Sí | — |
| Productos guardados en la nube | 1 | Ilimitados |
| Dashboard con búsqueda y categorías | — | Sí |
| Exportación a Excel editable | — | Sí |
| Reporte PDF por producto | — | Sí |
| Guía de costeo y estrategia de precios | — | Sí |
| Comparativa y simulador de escenarios | — | Sí |
| Actualizaciones futuras | — | Sí |

## Motor de precios

El cálculo vive en `src/lib/pricing.ts` y resuelve, para cada producto:

- **Costo variable por unidad**: materia prima + mano de obra (horas × valor hora) + packaging + otros variables.
- **Costo fijo por unidad**: costos fijos mensuales prorrateados por las unidades vendidas al mes.
- **Precio de venta sugerido**: `costo total / (1 − margen − impuestos)`, con margen calculado **sobre el precio de venta** (no sobre el costo).
- **Punto de equilibrio**: unidades necesarias al mes para cubrir los costos fijos.
- **Rango recomendado**: precio mínimo y máximo según márgenes de piso y techo configurados.

Admite dos modos: *por margen deseado* (la app calcula el precio) y *por precio objetivo* (la app calcula qué margen lográs).

## Stack

- **Next.js 16** (App Router, `src/`, TypeScript, Tailwind CSS 4, Turbopack)
- **Mercado Pago** — Checkout Pro (Wallet Brick) + webhooks para el cobro de Premium
- **Neon** — PostgreSQL serverless para `orders` y `products`
- **exceljs** — exportación a Excel
- **pdf-lib** — reportes PDF

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── create-preference/   # Crea la orden + preferencia de Checkout Pro
│   │   └── webhook/             # Verifica firma y marca la orden como pagada
│   ├── premium/                 # Página de checkout de Premium
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Landing
├── components/
│   ├── PricingCalculator.tsx    # Calculadora gratuita (cliente)
│   └── CheckoutWallet.tsx       # Form de email + botón Wallet de Mercado Pago
└── lib/
    ├── payments.ts              # Constantes de precio y URL base
    └── pricing.ts               # Motor de cálculo de precios
scripts/
└── test-pricing.ts              # Smoke test del motor de precios
```

## Flujo de pago

1. El usuario entra a `/premium`, ingresa su email y toca "Pagar con Mercado Pago".
2. `POST /api/create-preference` inserta una `order` en estado `pending` y crea una preferencia de Checkout Pro con `external_reference` = id de la orden.
3. El Wallet Brick abre el checkout. Al pagar, Mercado Pago notifica al webhook.
4. `POST /api/webhook` verifica la firma `X-Signature` (HMAC-SHA256), consulta el pago y, si está `approved`, marca la orden como `paid` con su `payment_id`.

## Base de datos (Neon / PostgreSQL)

```sql
CREATE TABLE orders (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | paid
  amount      INTEGER NOT NULL,                 -- en centavos
  payment_id  BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  data            JSONB NOT NULL,
  price_suggested NUMERIC NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Puesta en marcha

Requisitos: Node.js 20+ y una base PostgreSQL (por ejemplo, Neon).

```bash
npm install
```

Creá un archivo `.env`:

```env
MP_ACCESS_TOKEN=APP_USR-xxx
MP_PUBLIC_KEY=APP_USR-xxx
MP_WEBHOOK_SECRET=xxx            # opcional en dev, obligatorio en producción
DATABASE_URL=postgresql://...
SITE_URL=http://localhost:3000
```

> `.env` no se sube al repositorio. Las credenciales de producción se configuran en Vercel.

```bash
npm run dev     # desarrollo (Next.js)
npm run build   # producción
npm run lint    # eslint
npx tsx scripts/test-pricing.ts  # smoke test del motor de precios
```

## Deploy en Vercel

1. Importá el repositorio en Vercel (framework: **Next.js**, sin cambios de config).
2. Agregá las variables de entorno `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `DATABASE_URL` y `SITE_URL` (con la URL del deploy).
3. En el panel de Mercado Pago, configurá el webhook apuntando a `https://<tu-dominio>/api/webhook` con los eventos **Órdenes comerciales** y **Pagos**, y pegá el secreto generado en `MP_WEBHOOK_SECRET`.

## Roadmap

- [x] Landing + calculadora gratuita
- [x] Motor de precios con punto de equilibrio
- [x] Página Premium y cobro con Checkout Pro
- [x] Webhook de confirmación de pago
- [ ] Dashboard Premium (productos, búsqueda, categorías)
- [ ] Exportación a Excel y reportes PDF
- [ ] Guía de costeo (PDF)
- [ ] Desbloqueo de cuenta por email

## Aviso

Los resultados son orientativos y no constituyen asesoramiento contable, impositivo ni legal.

## Licencia

Uso privado. Todos los derechos reservados.
