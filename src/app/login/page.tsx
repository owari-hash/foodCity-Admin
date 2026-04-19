"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { clearClientAdminToken, writeClientAdminToken } from "@/lib/adminClientAuth";

type LoginErrorShape = {
  code?: string;
  message?: string;
};

function mapLoginErrorToMn(code?: string, message?: string): string {
  const c = (code ?? "").toUpperCase();
  const m = (message ?? "").toLowerCase();
  if (c === "UNAUTHORIZED" || m.includes("invalid credentials")) {
    return "Нэвтрэх нэр эсвэл нууц үг буруу байна.";
  }
  if (c === "VALIDATION_ERROR") {
    return "Оруулсан мэдээллээ шалгаад дахин оролдоно уу.";
  }
  if (c === "NOT_FOUND") {
    return "Серверийн хаяг олдсонгүй.";
  }
  return "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.";
}

function parseLoginError(raw: unknown): LoginErrorShape {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as { error?: LoginErrorShape | string };
    if (typeof parsed.error === "string") {
      try {
        const nested = JSON.parse(parsed.error) as { error?: LoginErrorShape };
        return nested.error ?? {};
      } catch {
        return {};
      }
    }
    return parsed.error ?? {};
  } catch {
    return {};
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch(`${ADMIN_BASE_PATH}/api/auth/logout`, { method: "POST" });
    } finally {
      clearClientAdminToken();
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }

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
        const parsed = parseLoginError(json.error);
        setError(mapLoginErrorToMn(parsed.code, parsed.message));
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
          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Гарах
          </button>
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
