import { randomUUID } from "node:crypto";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { neon } from "@neondatabase/serverless";
import {
  PREMIUM_ITEM_TITLE,
  PREMIUM_PRICE_ARS,
  PREMIUM_PRICE_CENTS,
  siteUrl,
} from "@/lib/payments";

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

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const publicKey = process.env.MP_PUBLIC_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  if (!accessToken || !publicKey || !databaseUrl) {
    return Response.json(
      { error: "Configuración de pagos incompleta" },
      { status: 500 }
    );
  }

  const orderId = randomUUID();
  const sql = neon(databaseUrl);

  try {
    await sql`
      INSERT INTO orders (id, email, status, amount)
      VALUES (${orderId}, ${email}, 'pending', ${PREMIUM_PRICE_CENTS})
    `;
  } catch (error) {
    console.error("Error insertando order:", error);
    return Response.json(
      { error: "No se pudo iniciar la compra. Intentá de nuevo." },
      { status: 500 }
    );
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: "costo-real-premium",
            title: PREMIUM_ITEM_TITLE,
            quantity: 1,
            unit_price: PREMIUM_PRICE_ARS,
            currency_id: "ARS",
          },
        ],
        external_reference: orderId,
        notification_url: `${siteUrl()}/api/webhook`,
        back_urls: {
          success: `${siteUrl()}/premium?result=success`,
          pending: `${siteUrl()}/premium?result=pending`,
          failure: `${siteUrl()}/premium?result=failure`,
        },
        statement_descriptor: "COSTOREAL",
      },
    });

    if (!result.id) {
      return Response.json(
        { error: "Mercado Pago no devolvió una preferencia válida" },
        { status: 502 }
      );
    }

    return Response.json({ preferenceId: result.id, publicKey });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    return Response.json(
      { error: "Mercado Pago no respondió. Intentá de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
