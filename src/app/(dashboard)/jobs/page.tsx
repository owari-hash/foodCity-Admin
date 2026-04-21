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
  location: string;
  description: string;
  salary: string;
};

type Job = {
  id: string;
  mn: LangContent;
  en: LangContent;
  company: string;
  contactEmail?: string;
  imageUrl?: string;
  active: boolean;
  postedByDisplayName?: string;
  postedByUsername?: string;
  lastEditedByDisplayName?: string;
  lastEditedByUsername?: string;
};

type JobForm = {
  title_mn: string;
  title_en: string;
  company: string;
  location_mn: string;
  location_en: string;
  description_mn: string;
  description_en: string;
  salary_mn: string;
  salary_en: string;
  contactEmail: string;
  imageUrl: string;
  active: boolean;
};

const empty: JobForm = {
  title_mn: "",
  title_en: "",
  company: "",
  location_mn: "",
  location_en: "",
  description_mn: "",
  description_en: "",
  salary_mn: "",
  salary_en: "",
  contactEmail: "",
  imageUrl: "",
  active: true,
};

type JobDialog = { mode: "add" } | { mode: "edit"; id: string };

function buildPayload(form: JobForm) {
  return {
    mn: {
      title: form.title_mn.trim(),
      location: form.location_mn.trim(),
      description: form.description_mn.trim(),
      salary: form.salary_mn.trim(),
    },
    en: {
      title: form.title_en.trim(),
      location: form.location_en.trim(),
      description: form.description_en.trim(),
      salary: form.salary_en.trim(),
    },
    company: form.company.trim(),
    contactEmail: form.contactEmail.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    active: form.active,
  };
}

export default function JobsPage() {
  const { lang, t } = useAdminLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<JobDialog | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs`),
        withClientAdminAuth(),
      );
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Job[] };
      setJobs(json.data ?? []);
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

  function openEdit(job: Job) {
    setForm({
      title_mn: job.mn?.title ?? "",
      title_en: job.en?.title ?? "",
      company: job.company ?? "",
      location_mn: job.mn?.location ?? "",
      location_en: job.en?.location ?? "",
      description_mn: job.mn?.description ?? "",
      description_en: job.en?.description ?? "",
      salary_mn: job.mn?.salary ?? "",
      salary_en: job.en?.salary ?? "",
      contactEmail: job.contactEmail ?? "",
      imageUrl: job.imageUrl ?? "",
      active: job.active,
    });
    setDialog({ mode: "edit", id: job.id });
  }

  function closeDialog() {
    setDialog(null);
    setForm(empty);
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault();
    if (!dialog) return;
    setError(null);

    try {
      const method = dialog.mode === "edit" ? "PATCH" : "POST";
      const baseUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/jobs");
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

  async function toggleActive(job: Job) {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${job.id}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !job.active }),
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
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${id}`),
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

  const currentTitle = (job: Job) =>
    (lang === "mn" ? job.mn?.title : job.en?.title) || job.mn?.title || job.en?.title || "—";
  const currentLocation = (job: Job) =>
    (lang === "mn" ? job.mn?.location : job.en?.location) || "";
  const currentSalary = (job: Job) =>
    (lang === "mn" ? job.mn?.salary : job.en?.salary) || "";
  const currentDescription = (job: Job) =>
    (lang === "mn" ? job.mn?.description : job.en?.description) || "";

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
          aria-labelledby="job-dialog-title"
          className="relative z-10 w-full max-w-4xl max-h-[min(92vh,920px)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2
            id="job-dialog-title"
            className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {dialog.mode === "edit"
              ? lang === "mn" ? "Ажлын зар засах" : "Edit Job Post"
              : lang === "mn" ? "Шинэ ажлын зар" : "New Job Post"}
          </h2>
          <form onSubmit={saveJob} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6 lg:col-span-2">
                <DualInput
                  required
                  label={t.siteContent.propertiesPage.fields.name}
                  mnValue={form.title_mn}
                  enValue={form.title_en}
                  onChangeMN={(v) => setForm({ ...form, title_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, title_en: v })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {lang === "mn" ? "Компани" : "Company"}
                    </label>
                    <input
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <DualInput
                    required
                    label={lang === "mn" ? "Байршил" : "Location"}
                    mnValue={form.location_mn}
                    enValue={form.location_en}
                    onChangeMN={(v) => setForm({ ...form, location_mn: v })}
                    onChangeEN={(v) => setForm({ ...form, location_en: v })}
                  />
                </div>
                <DualTextarea
                  required
                  label={t.siteContent.common.description}
                  rows={8}
                  mnValue={form.description_mn}
                  enValue={form.description_en}
                  onChangeMN={(v) => setForm({ ...form, description_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, description_en: v })}
                />
                <DualInput
                  label={t.siteContent.propertiesPage.fields.price}
                  mnValue={form.salary_mn}
                  enValue={form.salary_en}
                  onChangeMN={(v) => setForm({ ...form, salary_mn: v })}
                  onChangeEN={(v) => setForm({ ...form, salary_en: v })}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {t.siteContent.team.fields.email}
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">{t.siteContent.common.image}</p>
                  <ImageUploadField
                    previewFit="contain"
                    value={form.imageUrl}
                    onChange={(path) => setForm({ ...form, imageUrl: path })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  {lang === "mn" ? "Идэвхтэй" : "Active"}
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.jobs.title}</p>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          {t.jobs.addJob}
        </button>
      </div>

      {dialogModal}

      <ul className="space-y-3">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{currentTitle(job)}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {job.company}{currentLocation(job) ? ` · ${currentLocation(job)}` : ""}
                  </p>
                  {currentSalary(job) && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">{currentSalary(job)}</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {currentDescription(job)}
                  </p>
                  {(job.postedByDisplayName || job.lastEditedByDisplayName) && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {job.postedByDisplayName && (
                        <span>{lang === "mn" ? "Нийтлэгч" : "Posted by"}: {job.postedByDisplayName}</span>
                      )}
                      {job.postedByDisplayName && job.lastEditedByDisplayName ? " · " : null}
                      {job.lastEditedByDisplayName &&
                      job.lastEditedByUsername !== job.postedByUsername ? (
                        <span>{lang === "mn" ? "Сүүлд зассан" : "Last edited"}: {job.lastEditedByDisplayName}</span>
                      ) : null}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(job)}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  {job.active ? (lang === "mn" ? "Идэвхгүй болгох" : "Deactivate") : (lang === "mn" ? "Идэвхжүүлэх" : "Activate")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(job.id)}
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
