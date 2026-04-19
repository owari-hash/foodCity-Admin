"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_PERMISSION_KEYS,
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";

type AdminUserRow = {
  id: string;
  username: string;
  displayName: string;
  permissions: string[];
  active?: boolean;
};

const permLabels: Record<string, string> = {
  dashboard: "Самбар",
  orders: "Захиалга",
  "sales-ads": "Борлуулалтын зар",
  jobs: "Ажлын зар",
  chat: "Чат",
  "site-content": "Вэб агуулга",
  "admin-users": "Админ хэрэглэгчид",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>(["dashboard"]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/admin-users"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: AdminUserRow[] };
      setUsers(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleNewPerm(key: string) {
    setNewPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyId("new");
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/admin-users"),
        withClientAdminAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
            displayName: displayName.trim(),
            permissions: newPerms,
          }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      setAddOpen(false);
      setUsername("");
      setPassword("");
      setDisplayName("");
      setNewPerms(["dashboard"]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setBusyId(null);
    }
  }

  async function patchUser(
    id: string,
    body: { active?: boolean; permissions?: string[]; password?: string },
  ) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/admin-users/${id}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Админ эрхүүд</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Нэвтрэх нэр, нууц, харах цэсүүдийг тохируулна.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          Хэрэглэгч нэмэх
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={(e) => void createUser(e)}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Шинэ админ</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Нэвтрэх нэр
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Нэр (дэлгэцэнд)
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:col-span-2">
              Нууц үг (хамгийн багадаа 6 тэмдэгт)
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Эрхүүд</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADMIN_PERMISSION_KEYS.map((key) => (
                <label
                  key={key}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={newPerms.includes(key)}
                    onChange={() => toggleNewPerm(key)}
                  />
                  {permLabels[key] ?? key}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={busyId === "new" || newPerms.length === 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busyId === "new" ? "Хадгалж байна…" : "Үүсгэх"}
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{u.displayName}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">@{u.username}</p>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                  {(u.permissions ?? []).map((p) => permLabels[p] ?? p).join(", ") || "—"}
                </p>
                {u.active === false && (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    Идэвхгүй
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => void patchUser(u.id, { active: u.active !== false ? false : true })}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  {u.active === false ? "Идэвхжүүлэх" : "Идэвхгүй болгох"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
