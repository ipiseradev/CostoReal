import { neon } from "@neondatabase/serverless";
import { signAccessToken } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const email = (body?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Ingresá un email válido" }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return Response.json({ error: "Configuración incompleta" }, { status: 500 });
  }

  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT 1 FROM orders
    WHERE email = ${email} AND status = 'paid'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return Response.json(
      { error: "No encontramos un pago aprobado para ese email." },
      { status: 403 }
    );
  }

  return Response.json({ ok: true, email, token: signAccessToken(email) });
}
