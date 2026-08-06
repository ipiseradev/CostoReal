"use client";

import { useState, type FormEvent } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

export default function CheckoutWallet() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el pago.");
      }
      initMercadoPago(data.publicKey);
      setPreferenceId(data.preferenceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  if (preferenceId) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Completando la compra con <strong>{email}</strong>
        </div>
        <Wallet
          initialization={{ preferenceId, redirectMode: "self" }}
          customization={{
            theme: "dark",
            customStyle: {
              buttonBackground: "black",
              borderRadius: "12px",
              buttonHeight: "52px",
              hideValueProp: true,
            },
          }}
          locale="es-AR"
        />
        <button
          type="button"
          onClick={() => setPreferenceId(null)}
          className="text-center text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          ← Cambiar mi email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700">
          Tu email (para activar tu cuenta)
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !email}
        className="rounded-xl bg-zinc-900 px-5 py-3.5 font-semibold text-white shadow-md transition enabled:hover:-translate-y-0.5 enabled:hover:bg-zinc-700 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Preparando el pago…" : "Pagar con Mercado Pago"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-center text-xs text-zinc-500">
        Pago único · Acceso de por vida · Se desbloquea al instante
      </p>
    </form>
  );
}
