import { neon } from "@neondatabase/serverless";
import { emailFromRequest } from "@/lib/access";
import { buildPdf, pdfFileName, type SavedProduct } from "@/lib/exports";
import type { PricingInput } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return Response.json({ error: "Sesión inválida o vencida" }, { status: 401 });
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
  const rows = await sql`
    SELECT id, name, category, data, price_suggested, created_at, updated_at
    FROM products
    WHERE id = ${id} AND email = ${email}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return Response.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const product: SavedProduct = {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price_suggested),
    data: row.data as PricingInput,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const buffer = await buildPdf(product);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(product.name)}"`,
    },
  });
}
