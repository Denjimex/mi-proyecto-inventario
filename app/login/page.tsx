"use client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      // 👇 por si acaso, explícito
      credentials: "include",
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const data = await res.json();
      setError(data.error || "Error desconocido");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={handleLogin} className="card max-w-sm w-full p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

        {error && (
          <div className="border border-red-500/50 text-red-300 rounded-xl p-2 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" placeholder="tu@correo.com" />
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="password" required className="input" placeholder="********" />
        </div>

        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
