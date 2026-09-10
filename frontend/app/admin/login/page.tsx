"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);

    if (result.ok) {
      router.push("/admin");
    } else {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold">
          Вход в админку
        </h1>
        <p className="mt-2 text-sm text-muted">CustomPS</p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block font-mono text-xs text-muted">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-accent px-6 py-3 font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
