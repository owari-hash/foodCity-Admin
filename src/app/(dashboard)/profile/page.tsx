"use client";

import { useState, useEffect } from "react";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { withClientAdminAuth, ensureClientAuthorized, readClientAdminProfile, writeClientAdminSession, readClientAdminToken } from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { Save, User, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { t } = useAdminLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    const prof = readClientAdminProfile();
    if (prof) {
      setUsername(prof.username);
      setDisplayName(prof.displayName);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    if (password && password !== passwordConfirm) {
      setError(t.profile.messages.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const url = joinBackendRequestUrl(baseUrl, "/v1/admin/me");
      
      const res = await fetch(url, withClientAdminAuth({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          ...(password ? { password } : {}),
        }),
      }));

      const auth = await ensureClientAuthorized(res);
      if (auth !== "ok") return;

      const data = await res.json();
      if (data.error) {
        setError(data.error.message || t.common.error);
      } else {
        setSuccess(true);
        // Clear password fields
        setPassword("");
        setPasswordConfirm("");
        
        // Update session storage profile
        const currentProfile = readClientAdminProfile();
        const currentToken = readClientAdminToken();
        if (currentProfile && currentToken) {
           writeClientAdminSession(currentToken, {
             ...currentProfile,
             username: data.data.username,
             displayName: data.data.displayName,
           });
        }
      }
    } catch (err) {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t.profile.title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t.profile.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.profile.fields.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t.profile.fields.displayName}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-800" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t.profile.fields.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t.profile.fields.passwordConfirm}
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {t.profile.messages.success}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? t.common.saving : (
              <>
                <Save className="h-4 w-4" />
                {t.common.save}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
