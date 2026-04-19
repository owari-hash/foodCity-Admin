"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { writeClientAdminToken } from "@/lib/adminClientAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_BASE_PATH}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Нэвтрэх амжилтгүй");
        return;
      }
      if (json.token) {
        writeClientAdminToken(json.token);
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Сүлжээний алдаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src={`${ADMIN_BASE_PATH}/fclogo.png`}
            alt="Food City"
            width={180}
            height={64}
            className="h-12 w-auto object-contain"
            priority
          />
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Админ нэвтрэх</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Зөвхөн эрх бүхий хэрэглэгч</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="sr-only">
              Нэвтрэх нэр
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-600/30 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Нэвтрэх нэр"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="sr-only">
              Нууц үг
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-600/30 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Нууц үг"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
