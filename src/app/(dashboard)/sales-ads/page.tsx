"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureClientAuthorized, withClientAdminAuth } from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import ImageUploadField from "@/components/ImageUploadField";

type Ad = {
  id: string;
  title: string;
  summary?: string;
  body: string;
  imageUrl?: string;
  externalUrl?: string;
  active: boolean;
  validFrom?: string;
  validTo?: string;
};

type AdForm = Omit<Ad, "id"> & { validFrom?: string; validTo?: string };

const empty: AdForm = {
  title: "",
  summary: "",
  body: "",
  imageUrl: "",
  externalUrl: "",
  active: true,
  validFrom: "",
  validTo: "",
};

export default function SalesAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sales-ads"),
        withClientAdminAuth(),
      );
      if (!(await ensureClientAuthorized(res))) return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Ad[] };
      setAds(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sales-ads"),
        withClientAdminAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            imageUrl: form.imageUrl || undefined,
            externalUrl: form.externalUrl || undefined,
            summary: form.summary || undefined,
            validFrom: form.validFrom ? new Date(form.validFrom) : undefined,
            validTo: form.validTo ? new Date(form.validTo) : undefined,
          }),
        }),
      );
      if (!(await ensureClientAuthorized(res))) return;
      if (!res.ok) throw new Error(await res.text());
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа");
    }
  }

  async function toggleActive(ad: Ad) {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/sales-ads/${ad.id}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !ad.active }),
        }),
      );
      if (!(await ensureClientAuthorized(res))) return;
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа");
    }
  }

  async function remove(id: string) {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/sales-ads/${id}`),
        withClientAdminAuth({ method: "DELETE" }),
      );
      if (!(await ensureClientAuthorized(res))) return;
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа");
    }
  }

  return (
    <div className="w-full max-w-none space-y-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <form
        onSubmit={create}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Шинэ зар</h2>
        <input
          required
          placeholder="Гарчиг"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Товч тайлбар"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          required
          placeholder="Дэлгэрэнгүй"
          rows={4}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Зураг</p>
          <ImageUploadField
            value={form.imageUrl ?? ""}
            onChange={(path) => setForm({ ...form, imageUrl: path })}
          />
        </div>
        <input
          placeholder="Гадаад холбоос (сонголттой)"
          value={form.externalUrl}
          onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">
            Эхлэх
            <input
              type="datetime-local"
              value={form.validFrom ?? ""}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Дуусах
            <input
              type="datetime-local"
              value={form.validTo ?? ""}
              onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Идэвхтэй
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Нэмэх
        </button>
      </form>

      <ul className="space-y-3">
        {ads.map((ad) => (
          <li
            key={ad.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{ad.title}</h3>
                {ad.summary && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{ad.summary}</p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {ad.body}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(ad)}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  {ad.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(ad.id)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-400"
                >
                  Устгах
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
