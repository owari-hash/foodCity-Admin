"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Phone, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

interface SMSConfig {
  _id?: string;
  adminPhoneNumbers: string[];
  notificationSettings: {
    sendOnContactSubmission: boolean;
    sendOnOrderSubmission: boolean;
    sendOnJobApplication: boolean;
  };
  templates: {
    contactSubmission: string;
    orderSubmission: string;
    jobApplication: string;
  };
  stats: {
    totalSent: number;
    totalFailed: number;
    lastSentAt?: string;
  };
  updatedBy?: string;
}

const translations = {
  mn: {
    title: "SMS Тохиргоо",
    description: "Холбоо барих маягт болон бусад үйл явцын SMS мэдэгдэл тохируулах",
    adminPhones: "Админ утасны дугаарууд",
    adminPhonesDesc: "SMS мэдэгдэл хүлээн авах утасны дугаарууд",
    addPhone: "Утасны дугаар нэмэх",
    notificationSettings: "Мэдэгдэлийн тохиргоо",
    sendOnContact: "Холбоо барих маягт илгээхэд SMS илгээх",
    sendOnOrder: "Захиалга илгээхэд SMS илгээх",
    sendOnJob: "Ажлын өргөдөл илгээхэд SMS илгээх",
    templates: "Мессежийн загварууд",
    templatesDesc: "SMS мессежийг өөрчлөх. {name}, {phone}, {email} ашиглана уу",
    contactSubmission: "Холбоо барих маягт",
    orderSubmission: "Захиалга",
    jobApplication: "Ажлын өргөдөл",
    statistics: "SMS статистик",
    totalSent: "Нийт илгээсэн",
    failed: "Амжилтгүй",
    lastSent: "Сүүлийн илгээлт",
    never: "Хэзээ ч үгүй",
    testSMS: "SMS туршилт",
    testDesc: "Тохиргоо зөв эсэхийг шалгахын тулд туршилтын SMS илгээх",
    sendTest: "Туршилт илгээх",
    save: "Тохиргоо хадгалах",
    enterPhone: "Утасны дугаар оруулна уу (жишээ: +97699224455)",
    remove: "Устгах",
    loading: "SMS тохиргоо ачаалж байна...",
    failedLoad: "SMS тохиргоо ачаалахад алдаа гарлаа",
    saved: "SMS тохиргоо амжилттай хадгалагдлаа",
    testSent: "Туршилтын SMS амжилттай илгээгдлээ",
    enterPhoneTest: "Туршилтын утасны дугаар оруулна уу",
    saving: "Хадгалж байна...",
    sending: "Илгээж байна...",
  },
  en: {
    title: "SMS Configuration",
    description: "Configure SMS notifications for contact form submissions and other events",
    adminPhones: "Admin Phone Numbers",
    adminPhonesDesc: "Phone numbers that will receive SMS notifications",
    addPhone: "Add Phone Number",
    notificationSettings: "Notification Settings",
    sendOnContact: "Send SMS on contact form submission",
    sendOnOrder: "Send SMS on order submission",
    sendOnJob: "Send SMS on job application",
    templates: "Message Templates",
    templatesDesc: "Customize SMS messages. Use {name}, {phone}, {email} as placeholders",
    contactSubmission: "Contact Submission",
    orderSubmission: "Order Submission",
    jobApplication: "Job Application",
    statistics: "SMS Statistics",
    totalSent: "Total Sent",
    failed: "Failed",
    lastSent: "Last Sent",
    never: "Never",
    testSMS: "Test SMS",
    testDesc: "Send a test SMS to verify configuration",
    sendTest: "Send Test",
    save: "Save Configuration",
    enterPhone: "Enter phone number (e.g., +97699224455)",
    remove: "Remove",
    loading: "Loading SMS configuration...",
    failedLoad: "Failed to load SMS configuration",
    saved: "SMS configuration saved successfully",
    testSent: "Test SMS sent successfully",
    enterPhoneTest: "Enter test phone number",
    saving: "Saving...",
    sending: "Sending...",
  },
};

export default function SMSConfigPage() {
  const { lang } = useAdminLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"),
        withClientAdminAuth()
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(lang === "mn" ? "Хандалт хориотой" : "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { config: SMSConfig };
      setConfig(json.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failedLoad);
    } finally {
      setLoading(false);
    }
  }, [lang, t.failedLoad]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...withClientAdminAuth().headers,
          },
          body: JSON.stringify({
            ...config,
            updatedBy: "admin",
          }),
        }
      );

      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(lang === "mn" ? "Хандалт хориотой" : "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      setSuccess(t.saved);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "mn" ? "SMS тохиргоо хадгалахад алдаа гарлаа" : "Failed to save SMS configuration"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      setError("Please enter a phone number");
      return;
    }

    setTestLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config/test"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...withClientAdminAuth().headers,
          },
          body: JSON.stringify({ phoneNumber: testPhone }),
        }
      );

      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(lang === "mn" ? "Хандалт хориотой" : "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      setSuccess(t.testSent);
      setTestPhone("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "mn" ? "Туршилтын SMS илгээхэд алдаа гарлаа" : "Failed to send test SMS"));
    } finally {
      setTestLoading(false);
    }
  };

  const addPhoneNumber = () => {
    if (!config) return;
    const newPhone = prompt("Enter phone number (e.g., +97699224455):");
    if (newPhone && newPhone.trim()) {
      setConfig({
        ...config,
        adminPhoneNumbers: [...config.adminPhoneNumbers, newPhone.trim()],
      });
    }
  };

  const removePhoneNumber = (index: number) => {
    if (!config) return;
    setConfig({
      ...config,
      adminPhoneNumbers: config.adminPhoneNumbers.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading SMS configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Failed to load SMS configuration</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{t.title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t.description}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-center">
            <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-emerald-600 dark:border-zinc-700 dark:border-t-emerald-500"></div>
            <p className="text-zinc-600 dark:text-zinc-400">{t.loading}</p>
          </div>
        </div>
      ) : !config ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-950/20">
          <p className="text-red-800 dark:text-red-200">{t.failedLoad}</p>
        </div>
      ) : (
        <>
          {/* Admin Phone Numbers */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-6 flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t.adminPhones}</h2>
            </div>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{t.adminPhonesDesc}</p>

            <div className="mb-4 space-y-2">
              {config.adminPhoneNumbers.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Утасны дугаар байхгүй</p>
              ) : (
                config.adminPhoneNumbers.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{phone}</span>
                    <button
                      onClick={() => removePhoneNumber(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={addPhoneNumber}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              {t.addPhone}
            </button>
          </div>

          {/* Notification Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t.notificationSettings}</h2>

            <div className="space-y-4">
              {[
                { key: "sendOnContactSubmission", label: t.sendOnContact },
                { key: "sendOnOrderSubmission", label: t.sendOnOrder },
                { key: "sendOnJobApplication", label: t.sendOnJob },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.notificationSettings[key as keyof typeof config.notificationSettings]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        notificationSettings: {
                          ...config.notificationSettings,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message Templates */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t.templates}</h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">{t.templatesDesc}</p>

            <div className="space-y-6">
              {[
                { key: "contactSubmission", label: t.contactSubmission },
                { key: "orderSubmission", label: t.orderSubmission },
                { key: "jobApplication", label: t.jobApplication },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {label}
                  </label>
                  <textarea
                    value={config.templates[key as keyof typeof config.templates]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        templates: {
                          ...config.templates,
                          [key]: e.target.value,
                        },
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {config.stats && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t.statistics}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {config.stats.totalSent}
                  </div>
                  <div className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{t.totalSent}</div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {config.stats.totalFailed}
                  </div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">{t.failed}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.lastSent}</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {config.stats.lastSentAt
                      ? new Date(config.stats.lastSentAt).toLocaleString(lang === "mn" ? "mn-MN" : "en-US")
                      : t.never}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test SMS */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t.testSMS}</h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{t.testDesc}</p>

            <div className="flex gap-3">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder={t.enterPhone}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
              />
              <button
                onClick={handleTestSMS}
                disabled={testLoading}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-zinc-600"
              >
                {testLoading ? t.sending : t.sendTest}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-400 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:disabled:bg-zinc-600"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
