"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  readClientAdminProfile,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Phone, Trash2, Plus, CheckCircle2, AlertCircle, Save, Send } from "lucide-react";

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
    addPhone: "Нэмэх",
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
    enterPhone: "Утасны дугаар оруулна уу",
    remove: "Устгах",
    loading: "SMS тохиргоо ачаалж байна...",
    failedLoad: "SMS тохиргоо ачаалахад алдаа гарлаа",
    saved: "SMS тохиргоо амжилттай хадгалагдлаа",
    testSent: "Туршилтын SMS амжилттай илгээгдлээ",
    enterPhoneTest: "Туршилтын утасны дугаар оруулна уу",
    saving: "Хадгалж байна...",
    sending: "Илгээж байна...",
    placeholderPhone: "+97699224455",
    updatedBy: "Сүүлд шинэчилсэн:",
  },
  en: {
    title: "SMS Configuration",
    description: "Configure SMS notifications for contact form submissions and other events",
    adminPhones: "Admin Phone Numbers",
    adminPhonesDesc: "Phone numbers that will receive SMS notifications",
    addPhone: "Add",
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
    enterPhone: "Enter phone number",
    remove: "Remove",
    loading: "Loading SMS configuration...",
    failedLoad: "Failed to load SMS configuration",
    saved: "SMS configuration saved successfully",
    testSent: "Test SMS sent successfully",
    enterPhoneTest: "Enter test phone number",
    saving: "Saving...",
    sending: "Sending...",
    placeholderPhone: "+97699224455",
    updatedBy: "Last updated by:",
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
  const [newPhone, setNewPhone] = useState("");
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

    const profile = readClientAdminProfile();

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
            updatedBy: profile?.displayName || "admin",
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

      const json = (await res.json()) as { config: SMSConfig };
      setConfig(json.config);
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
      setError(t.enterPhoneTest);
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
      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || "Failed to send test SMS");
      }

      setSuccess(t.testSent);
      setTestPhone("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "mn" ? "Туршилтын SMS илгээхэд алдаа гарлаа" : "Failed to send test SMS"));
    } finally {
      setTestLoading(false);
    }
  };

  const addPhoneNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newPhone.trim()) return;
    
    if (config.adminPhoneNumbers.includes(newPhone.trim())) {
      setError(lang === "mn" ? "Утасны дугаар бүртгэгдсэн байна" : "Phone number already exists");
      return;
    }

    setConfig({
      ...config,
      adminPhoneNumbers: [...config.adminPhoneNumbers, newPhone.trim()],
    });
    setNewPhone("");
    setError(null);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-500"></div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{t.title}</h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{t.description}</p>
        </div>
        {config?.updatedBy && (
          <div className="text-sm text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
            {t.updatedBy} <span className="font-semibold text-zinc-700 dark:text-zinc-300">{config.updatedBy}</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="fixed top-24 right-8 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {error && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-xl shadow-red-500/10 dark:border-red-900/30 dark:bg-zinc-950 pointer-events-auto animate-in slide-in-from-right">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-xl shadow-green-500/10 dark:border-green-900/30 dark:bg-zinc-950 pointer-events-auto animate-in slide-in-from-right">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {/* Admin Phone Numbers */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.adminPhones}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.adminPhonesDesc}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {config?.adminPhoneNumbers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">Жагсаалт хоосон байна</p>
                  </div>
                ) : (
                  config?.adminPhoneNumbers.map((phone, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-50">{phone}</span>
                      </div>
                      <button
                        onClick={() => removePhoneNumber(index)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                        title={t.remove}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={addPhoneNumber} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={t.placeholderPhone}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newPhone.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>
            </div>
          </section>

          {/* Message Templates */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.templates}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.templatesDesc}</p>
            </div>

            <div className="p-6 space-y-8">
              {[
                { key: "contactSubmission", label: t.contactSubmission, placeholders: "{name}, {phone}, {email}, {subject}" },
                { key: "orderSubmission", label: t.orderSubmission, placeholders: "{name}, {orderId}" },
                { key: "jobApplication", label: t.jobApplication, placeholders: "{name}, {position}" },
              ].map(({ key, label, placeholders }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      {label}
                    </label>
                    <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                      {placeholders}
                    </span>
                  </div>
                  <textarea
                    value={config?.templates[key as keyof typeof config.templates] || ""}
                    onChange={(e) =>
                      config && setConfig({
                        ...config,
                        templates: {
                          ...config.templates,
                          [key]: e.target.value,
                        },
                      })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50/30 px-4 py-3 text-sm text-zinc-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-50 dark:focus:bg-zinc-900"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* Notification Settings */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.notificationSettings}</h2>
            </div>

            <div className="p-6 space-y-4">
              {[
                { key: "sendOnContactSubmission", label: t.sendOnContact },
                { key: "sendOnOrderSubmission", label: t.sendOnOrder },
                { key: "sendOnJobApplication", label: t.sendOnJob },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config?.notificationSettings[key as keyof typeof config.notificationSettings] || false}
                      onChange={(e) =>
                        config && setConfig({
                          ...config,
                          notificationSettings: {
                            ...config.notificationSettings,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-zinc-600 peer-checked:bg-emerald-600"></div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Statistics */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.statistics}</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {config?.stats?.totalSent || 0}
                  </div>
                  <div className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t.totalSent}</div>
                </div>
                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">
                    {config?.stats?.totalFailed || 0}
                  </div>
                  <div className="mt-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">{t.failed}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t.lastSent}</div>
                <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                  {config?.stats?.lastSentAt
                    ? new Date(config.stats.lastSentAt).toLocaleString(lang === "mn" ? "mn-MN" : "en-US")
                    : t.never}
                </div>
              </div>
            </div>
          </section>

          {/* Test SMS */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.testSMS}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.testDesc}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-3">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder={t.placeholderPhone}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button
                  onClick={handleTestSMS}
                  disabled={testLoading || !testPhone}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                >
                  {testLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {testLoading ? t.sending : t.sendTest}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-12 py-4 rounded-full bg-zinc-900 text-white font-bold text-lg hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-2xl shadow-zinc-950/20 disabled:opacity-50 active:scale-95"
        >
          {saving ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          ) : (
            <Save className="h-6 w-6" />
          )}
          {saving ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}
