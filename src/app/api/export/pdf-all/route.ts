import { neon } from "@neondatabase/serverless";
import { emailFromRequest } from "@/lib/access";
import { buildPdfAll, pdfAllFileName, type SavedProduct } from "@/lib/exports";
import type { PricingInput } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const email = emailFromRequest(request);
  if (!email) {
    return Response.json({ error: "Sesión inválida o vencida" }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Configuración incompleta" }, { status: 500 });

  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT id, name, category, data, price_suggested, created_at, updated_at
    FROM products
    WHERE email = ${email}
    ORDER BY updated_at DESC
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Todavía no guardaste ningún producto." }, { status: 404 });
  }

  const products: SavedProduct[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    price: Number(r.price_suggested),
    data: r.data as PricingInput,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const buffer = await buildPdfAll(products);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfAllFileName()}"`,
    },
  });
}
