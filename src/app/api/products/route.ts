import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { emailFromRequest } from "@/lib/access";
import { calculatePricing, type PricingInput } from "@/lib/pricing";
import { DEFAULT_CATEGORY } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  email: string;
  name: string;
  category: string;
  data: unknown;
  price_suggested: string;
  created_at: string;
  updated_at: string;
};

function parseInput(raw: unknown): PricingInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const numbers = [
    "materials",
    "laborHours",
    "laborRate",
    "packaging",
    "otherVariable",
    "fixedCosts",
    "unitsMonth",
    "taxes",
    "marginPercent",
    "marginFloor",
    "marginCap",
    "targetPrice",
  ];
  for (const key of numbers) {
    if (typeof o[key] !== "number" || !Number.isFinite(o[key])) return null;
  }
  if (o.mode !== "margin" && o.mode !== "target") return null;
  const optional = [
    "discountPercent",
    "channelCommission",
    "shippingPerSale",
    "monthlyGoal",
  ];
  for (const key of optional) {
    if (
      o[key] !== undefined &&
      (typeof o[key] !== "number" || !Number.isFinite(o[key]) || (o[key] as number) < 0)
    ) {
      return null;
    }
  }
  const itemType = o.itemType === "servicio" || o.itemType === "digital" ? o.itemType : "producto";
  return {
    ...(o as unknown as PricingInput),
    itemType,
    discountPercent: (o.discountPercent as number) ?? 0,
    channelCommission: (o.channelCommission as number) ?? 0,
    shippingPerSale: (o.shippingPerSale as number) ?? 0,
    monthlyGoal: (o.monthlyGoal as number) ?? 0,
  };
}

export async function GET(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return Response.json({ error: "Sesión inválida o vencida. Volvé a ingresar tu email." }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Configuración incompleta" }, { status: 500 });

  const sql = neon(databaseUrl);
  const rows = (await sql`
    SELECT id, email, name, category, data, price_suggested, created_at, updated_at
    FROM products
    WHERE email = ${email}
    ORDER BY updated_at DESC
  `) as unknown as ProductRow[];

  return Response.json({
    products: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: Number(r.price_suggested),
      data: r.data,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return Response.json({ error: "Sesión inválida o vencida. Volvé a ingresar tu email." }, { status: 401 });
  }

  let body: { id?: string; name?: string; category?: string; input?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const name = (body?.name ?? "").trim();
  if (!name) {
    return Response.json({ error: "Poné un nombre al producto" }, { status: 400 });
  }
  if (name.length > 120) {
    return Response.json({ error: "El nombre es demasiado largo" }, { status: 400 });
  }

  const category = (body?.category ?? "").trim() || DEFAULT_CATEGORY;
  if (category.length > 40) {
    return Response.json({ error: "La categoría es demasiado larga" }, { status: 400 });
  }

  const input = parseInput(body?.input);
  if (!input) {
    return Response.json({ error: "Datos de costos inválidos" }, { status: 400 });
  }

  let result;
  try {
    result = calculatePricing(input);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "No se pudo calcular el precio" },
      { status: 400 }
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Configuración incompleta" }, { status: 500 });

  const sql = neon(databaseUrl);
  const id = body.id?.trim() ? body.id : randomUUID();

  if (body.id) {
    const owned = await sql`
      SELECT 1 FROM products WHERE id = ${id} AND email = ${email} LIMIT 1
    `;
    if (owned.length === 0) {
      return Response.json({ error: "Producto no encontrado" }, { status: 404 });
    }
  }

  const rows = (await sql`
    INSERT INTO products (id, email, name, category, data, price_suggested)
    VALUES (${id}, ${email}, ${name}, ${category}, ${JSON.stringify(input)}::jsonb, ${result.price})
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          data = EXCLUDED.data,
          price_suggested = EXCLUDED.price_suggested,
          updated_at = now()
    RETURNING id, email, name, category, data, price_suggested, created_at, updated_at
  `) as unknown as ProductRow[];

  const row = rows[0];
  if (!row) {
    return Response.json({ error: "No se pudo guardar el producto" }, { status: 500 });
  }

  return Response.json({
    product: {
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price_suggested),
      data: row.data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}

export async function DELETE(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return Response.json({ error: "Sesión inválida o vencida. Volvé a ingresar tu email." }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const id = (body?.id ?? "").trim();
  if (!id) {
    return Response.json({ error: "Falta el id del producto" }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Configuración incompleta" }, { status: 500 });

  const sql = neon(databaseUrl);
  await sql`
    DELETE FROM products WHERE id = ${id} AND email = ${email}
  `;

  return Response.json({ ok: true });
}
