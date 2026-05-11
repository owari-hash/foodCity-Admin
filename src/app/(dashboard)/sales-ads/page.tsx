"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import ImageUploadField from "@/components/ImageUploadField";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { DualInput, DualTextarea } from "../site-content/editorUi";

type LangContent = {
  title: string;
  summary: string;
  body: string;
  badge: string;
};

type Ad = {
  id: string;
  mn: LangContent;
  en: LangContent;
  imageUrl?: string;
  externalUrl?: string;
  active: boolean;
  validFrom?: string;
  validTo?: string;
  postedByDisplayName?: string;
  postedByUsername?: string;
  lastEditedByDisplayName?: string;
  lastEditedByUsername?: string;
};

type AdForm = {
  title_mn: string;
  title_en: string;
  summary_mn: string;
  summary_en: string;
  body_mn: string;
  body_en: string;
  badge_mn: string;
  badge_en: string;
  imageUrl: string;
  externalUrl: string;
  active: boolean;
  validFrom: string;
  validTo: string;
};

const empty: AdForm = {
  title_mn: "",
  title_en: "",
  summary_mn: "",
  summary_en: "",
  body_mn: "",
  body_en: "",
  badge_mn: "",
  badge_en: "",
  imageUrl: "",
  externalUrl: "",
  active: true,
  validFrom: "",
  validTo: "",
};

type SalesDialog = { mode: "add" } | { mode: "edit"; id: string };

function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildPayload(form: AdForm) {
  return {
    mn: {
      title: form.title_mn.trim(),
      summary: form.summary_mn.trim(),
      body: form.body_mn.trim(),
      badge: form.badge_mn.trim(),
    },
    en: {
      title: form.title_en.trim(),
      summary: form.summary_en.trim(),
      body: form.body_en.trim(),
      badge: form.badge_en.trim(),
    },
    imageUrl: form.imageUrl.trim() || undefined,
    externalUrl: form.externalUrl.trim() || undefined,
    active: form.active,
    validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
    validTo: form.validTo ? new Date(form.validTo).toISOString() : undefined,
  };
}

export default function SalesAdsPage() {
  const { lang, t } = useAdminLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<SalesDialog | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/sales-ads`),
        withClientAdminAuth(),
      );
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Ad[] };
      setAds(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    }
  }, [t.common.error]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setDialog(null);
        setForm(empty);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [dialog]);

  function openAdd() {
    setForm(empty);
    setDialog({ mode: "add" });
  }

  function openEdit(ad: Ad) {
    setForm({
      title_mn: ad.mn?.title ?? "",
      title_en: ad.en?.title ?? "",
      summary_mn: ad.mn?.summary ?? "",
      summary_en: ad.en?.summary ?? "",
      body_mn: ad.mn?.body ?? "",
      body_en: ad.en?.body ?? "",
      badge_mn: ad.mn?.badge ?? "",
      badge_en: ad.en?.badge ?? "",
      imageUrl: ad.imageUrl ?? "",
      externalUrl: ad.externalUrl ?? "",
      active: ad.active,
      validFrom: toDateTimeLocal(ad.validFrom),
      validTo: toDateTimeLocal(ad.validTo),
    });
    setDialog({ mode: "edit", id: ad.id });
  }

  function closeDialog() {
    setDialog(null);
    setForm(empty);
  }

  async function saveAd(e: React.FormEvent) {
    e.preventDefault();
    if (!dialog) return;
    setError(null);

    try {
      const method = dialog.mode === "edit" ? "PATCH" : "POST";
      const baseUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sales-ads");
      const url = dialog.mode === "edit" ? `${baseUrl}/${dialog.id}` : baseUrl;

      const res = await fetch(
        url,
        withClientAdminAuth({
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(form)),
        }),
      );

      if (!res.ok) throw new Error(await res.text());

      closeDialog();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
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
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function remove(id: string) {
    if (!confirm(lang === "mn" ? "Устгах уу?" : "Are you sure you want to delete?")) return;
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/sales-ads/${id}`),
        withClientAdminAuth({ method: "DELETE" }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  const currentTitle = (ad: Ad) => (lang === "mn" ? ad.mn?.title : ad.en?.title) || ad.mn?.title || ad.en?.title || "—";
  const currentSummary = (ad: Ad) => (lang === "mn" ? ad.mn?.summary : ad.en?.summary) || "";
  const currentBody = (ad: Ad) => (lang === "mn" ? ad.mn?.body : ad.en?.body) || "";

  const dialogModal =
    dialog &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6"
        role="presentation"
      >
        <button
          type="button"
          aria-label={t.common.cancel}
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          onClick={closeDialog}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sales-ad-dialog-title"
          className="relative z-10 w-full max-w-4xl max-h-[min(92vh,920px)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2
            id="sales-ad-dialog-title"
            className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {dialog.mode === "edit" ? (lang === "mn" ? "Зар засах" : "Edit Sales Ad") : (lang === "mn" ? "Шинэ зар" : "New Sales Ad")}
          </h2>
          <form onSubmit={saveAd} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6 lg:col-span-2">
                <DualInput
                  required
                  label={t.siteContent.common.title}
                  mnValue={form.title_mn}
                  enValue={form.title_en}
                  onChangeMN={(v) => setForm({ ...form, title_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, title_en: v })}
                />
                <DualInput
                  label={lang === "mn" ? "Badge (онцлох, хямдрал...)" : "Badge (Featured, Sale...)"}
                  mnValue={form.badge_mn}
                  enValue={form.badge_en}
                  onChangeMN={(v) => setForm({ ...form, badge_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, badge_en: v })}
                />
                <DualInput
                  label={t.siteContent.common.subtitle}
                  mnValue={form.summary_mn}
                  enValue={form.summary_en}
                  onChangeMN={(v) => setForm({ ...form, summary_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, summary_en: v })}
                />
                <DualTextarea
                  required
                  label={t.siteContent.common.description}
                  rows={8}
                  mnValue={form.body_mn}
                  enValue={form.body_en}
                  onChangeMN={(v) => setForm({ ...form, body_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, body_en: v })}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.siteContent.common.image}</p>
                  <ImageUploadField
                    value={form.imageUrl}
                    onChange={(path) => setForm({ ...form, imageUrl: path })}
                  />
                </div>
                <input
                  placeholder={lang === "mn" ? "Гадаад холбоос (сонголттой)" : "External URL (optional)"}
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  {lang === "mn" ? "Идэвхтэй" : "Active"}
                </label>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-500">
                  {lang === "mn" ? "Эхлэх" : "Starts"}
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="block text-xs font-medium text-zinc-500">
                  {lang === "mn" ? "Дуусах" : "Ends"}
                  <input
                    type="datetime-local"
                    value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {dialog.mode === "edit" ? t.common.save : t.siteContent.common.add}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="w-full max-w-none space-y-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.salesAds.title}</p>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          {t.salesAds.addAd}
        </button>
      </div>

      {dialogModal}

      <ul className="space-y-3">
        {ads.map((ad) => (
          <li
            key={ad.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{currentTitle(ad)}</h3>
                {currentSummary(ad) && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{currentSummary(ad)}</p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {currentBody(ad)}
                </p>
                {(ad.postedByDisplayName || ad.lastEditedByDisplayName) && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {ad.postedByDisplayName && (
                      <span>{lang === "mn" ? "Нийтлэгч" : "Posted by"}: {ad.postedByDisplayName}</span>
                    )}
                    {ad.postedByDisplayName && ad.lastEditedByDisplayName ? " · " : null}
                    {ad.lastEditedByDisplayName && ad.lastEditedByUsername !== ad.postedByUsername ? (
                       <span>{lang === "mn" ? "Сүүлд зассан" : "Last edited"}: {ad.lastEditedByDisplayName}</span>
                    ) : null}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(ad)}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  {ad.active ? (lang === "mn" ? "Идэвхгүй болгох" : "Deactivate") : (lang === "mn" ? "Идэвхжүүлэх" : "Activate")}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(ad)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => remove(ad.id)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-400"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
