import { ImageResponse } from "next/og";

export const alt = "CostoReal — Calculá el precio justo de tus productos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f2efe6",
          color: "#0e1f17",
          fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#0e7a4b",
              color: "#f2efe6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            $
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            CostoReal
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            Calculá el precio justo
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            de tus productos
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 28, color: "#5d6b60" }}>
          <span>Margen real</span>
          <span>Costos fijos</span>
          <span>Punto de equilibrio</span>
          <span>Gratis · ARS</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
