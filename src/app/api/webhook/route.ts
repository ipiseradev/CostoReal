import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, MerchantOrder, Payment } from "mercadopago";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OK = () => Response.json({ ok: true });

export async function GET() {
  return OK();
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.MP_WEBHOOK_SECRET;

  let topic = "";
  let dataId: string | null = null;

  try {
    const parsed = JSON.parse(rawBody);
    if (parsed?.data?.id) {
      dataId = String(parsed.data.id);
      topic = String(parsed.type ?? parsed.topic ?? "payment");
    } else if (parsed?.id) {
      dataId = String(parsed.id);
      topic = String(parsed.topic ?? "payment");
    }
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!dataId) {
    return Response.json({ error: "No se encontró el id en la notificación" }, { status: 400 });
  }

  if (secret) {
    if (!verifySignature(request, dataId, secret)) {
      return Response.json({ error: "Firma inválida" }, { status: 401 });
    }
  } else {
    console.warn(
      "MP_WEBHOOK_SECRET no configurado — verificación de firma desactivada. Configuralo antes de producción."
    );
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const databaseUrl = process.env.DATABASE_URL;
  if (!accessToken || !databaseUrl) {
    return Response.json({ error: "Configuración incompleta" }, { status: 500 });
  }

  const client = new MercadoPagoConfig({ accessToken });

  try {
    const paymentId =
      topic === "merchant_order"
        ? await resolveApprovedPaymentId(client, dataId)
        : dataId;

    const payment = await new Payment(client).get({ id: paymentId });

    if (payment.status !== "approved") {
      return OK();
    }

    const externalRef = payment.external_reference;
    if (!externalRef) {
      return OK();
    }

    const sql = neon(databaseUrl);
    await sql`
      UPDATE orders
      SET status = 'paid', payment_id = ${Number(payment.id)}
      WHERE id = ${externalRef} AND status = 'pending'
    `;

    return OK();
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

function verifySignature(request: Request, dataId: string, secret: string): boolean {
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  if (!xSignature || !xRequestId) return false;

  const params: Record<string, string> = {};
  for (const pair of xSignature.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    let value = pair.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // si el valor no viene percent-encoded, se usa tal cual
    }
    params[key] = value;
  }
  const ts = params["ts"];
  const v1 = params["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const v1Buf = Buffer.from(v1);

  if (expectedBuf.length !== v1Buf.length) return false;
  return timingSafeEqual(expectedBuf, v1Buf);
}

async function resolveApprovedPaymentId(
  client: MercadoPagoConfig,
  merchantOrderId: string
): Promise<string> {
  const order = await new MerchantOrder(client).get({ merchantOrderId });
  const payments = order.payments ?? [];
  const approved = payments.find((p) => p.status === "approved");
  const payment = approved ?? payments[0];
  if (!payment?.id) {
    throw new Error("La orden de mercado no tiene pagos");
  }
  return String(payment.id);
}
