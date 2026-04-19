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

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  contactEmail?: string;
  imageUrl?: string;
  active: boolean;
  postedByDisplayName?: string;
  postedByUsername?: string;
  lastEditedByDisplayName?: string;
  lastEditedByUsername?: string;
};

const empty: Omit<Job, "id"> = {
  title: "",
  company: "",
  location: "",
  description: "",
  salary: "",
  contactEmail: "",
  imageUrl: "",
  active: true,
};

type JobDialog = { mode: "add" } | { mode: "edit"; id: string };

function buildJobBody(form: Omit<Job, "id">) {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    description: form.description.trim(),
    salary: (form.salary ?? "").trim() || undefined,
    contactEmail: (form.contactEmail ?? "").trim() || undefined,
    imageUrl: form.imageUrl?.trim() || undefined,
    active: form.active,
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<JobDialog | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/jobs"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Job[] };
      setJobs(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }, []);

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
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salary: job.salary ?? "",
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
    const payload = buildJobBody(form);
    try {
      const url =
        dialog.mode === "edit"
          ? joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${dialog.id}`)
          : joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/jobs");
      const res = await fetch(
        url,
        withClientAdminAuth({
          method: dialog.mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      closeDialog();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа");
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
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
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
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${id}`),
        withClientAdminAuth({ method: "DELETE" }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(PERMISSION_DENIED_MN);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа");
    }
  }

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
          aria-label="Хаах"
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
            {dialog.mode === "edit" ? "Ажлын зар засах" : "Шинэ ажлын зар"}
          </h2>
          <form onSubmit={saveJob} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4 lg:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    placeholder="Албан тушаал / гарчиг"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    required
                    placeholder="Компани"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <input
                  required
                  placeholder="Байршил"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <textarea
                  required
                  placeholder="Тайлбар"
                  rows={8}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-40 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <input
                    placeholder="Цалин (сонголттой)"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    type="email"
                    placeholder="Имэйл холбоо барих"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Зураг (сонголттой)</p>
                  <ImageUploadField
                    previewFit="contain"
                    value={form.imageUrl ?? ""}
                    onChange={(path) => setForm({ ...form, imageUrl: path })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Идэвхтэй
                </label>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {dialog.mode === "edit" ? "Хадгалах" : "Нэмэх"}
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Ажлын зарууд</p>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          Ажлын зар нэмэх
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
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{job.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {job.company} · {job.location}
                  </p>
                  {job.salary && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">{job.salary}</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {job.description}
                  </p>
                  {(job.postedByDisplayName || job.lastEditedByDisplayName) && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {job.postedByDisplayName && (
                        <span>Нийтлэгч: {job.postedByDisplayName}</span>
                      )}
                      {job.postedByDisplayName && job.lastEditedByDisplayName ? " · " : null}
                      {job.lastEditedByDisplayName &&
                      job.lastEditedByUsername !== job.postedByUsername ? (
                        <span>Сүүлд зассан: {job.lastEditedByDisplayName}</span>
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
                  Засах
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(job)}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  {job.active ? "Идэвхгүй" : "Идэвхжүүлэх"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(job.id)}
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
