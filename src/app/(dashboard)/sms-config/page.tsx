"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  readClientAdminProfile,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Phone, Trash2, Plus, CheckCircle2, AlertCircle, Save, Send, MessageSquare, Clock, User, Mail, FileText } from "lucide-react";

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "responded";
  createdAt: string;
  updatedAt: string;
}

interface SMSConfig {
  _id?: string;
  adminPhoneNumbers: string[];
  notificationSettings: {
    sendOnContactSubmission: boolean;
  };
  templates: {
    contactSubmission: string;
  };
  updatedBy?: string;
}

const translations = {
  mn: {
    title: "Мессеж болон санал",
    description: "Хэрэглэгчдийн ирүүлсэн санал хүсэлтийг удирдах болон SMS мэдэгдэл тохируулах",
    adminPhones: "Мэдэгдэл хүлээн авах дугаарууд",
    adminPhonesDesc: "Шинэ санал ирэхэд SMS очих утасны дугаарууд",
    addPhone: "Нэмэх",
    template: "SMS загвар",
    templateDesc: "SMS мессежийг өөрчлөх. {name}, {phone}, {email}, {subject} ашиглана уу",
    submissions: "Санал хүсэлтийн жагсаалт",
    noSubmissions: "Одоогоор санал хүсэлт ирээгүй байна",
    details: "Дэлгэрэнгүй",
    status: "Төлөв",
    save: "Тохиргоо хадгалах",
    testSMS: "Туршилт",
    sendTest: "Илгээх",
    loading: "Уншиж байна...",
    saved: "Амжилттай хадгалагдлаа",
    testSent: "Туршилтын SMS илгээгдлээ",
    placeholderPhone: "+97699224455",
    all: "Бүгд",
    new: "Шинэ",
    read: "Уншсан",
    responded: "Хариулсан",
  },
  en: {
    title: "Messages & Feedback",
    description: "Manage user submissions and configure SMS notifications",
    adminPhones: "Notification Numbers",
    adminPhonesDesc: "Phone numbers that will receive SMS notifications",
    addPhone: "Add",
    template: "SMS Template",
    templateDesc: "Customize SMS message. Use {name}, {phone}, {email}, {subject}",
    submissions: "Submissions List",
    noSubmissions: "No submissions found",
    details: "Details",
    status: "Status",
    save: "Save Config",
    testSMS: "Test",
    sendTest: "Send",
    loading: "Loading...",
    saved: "Saved successfully",
    testSent: "Test SMS sent",
    placeholderPhone: "+97699224455",
    all: "All",
    new: "New",
    read: "Read",
    responded: "Responded",
  },
};

export default function SMSConfigPage() {
  const { lang } = useAdminLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  // Config state
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  
  // Submissions state
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "read" | "responded">("all");
  
  // General state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, subRes] = await Promise.all([
        fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"), withClientAdminAuth()),
        fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/contact/submissions"), withClientAdminAuth()),
      ]);

      await ensureClientAuthorized(configRes);
      await ensureClientAuthorized(subRes);

      if (!configRes.ok || !subRes.ok) throw new Error("Failed to load data");

      const configJson = await configRes.json();
      const subJson = await subRes.json();

      setConfig(configJson.config);
      setSubmissions(subJson.submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const profile = readClientAdminProfile();

    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...withClientAdminAuth().headers },
        body: JSON.stringify({ ...config, updatedBy: profile?.displayName || "admin" }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSuccess(t.saved);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/contact/submissions/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...withClientAdminAuth().headers },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setSubmissions(submissions.map(s => s._id === id ? { ...s, status: newStatus as any } : s));
      if (selectedSubmission?._id === id) setSelectedSubmission({ ...selectedSubmission, status: newStatus as any });
    } catch (e) {
      setError("Failed to update status");
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) return;
    setTestLoading(true);
    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...withClientAdminAuth().headers },
        body: JSON.stringify({ phoneNumber: testPhone }),
      });
      if (!res.ok) throw new Error();
      setSuccess(t.testSent);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Test SMS failed");
    } finally {
      setTestLoading(false);
    }
  };

  const filtered = filterStatus === "all" ? submissions : submissions.filter(s => s.status === filterStatus);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-600"></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20">
      {/* Alerts */}
      <div className="fixed right-8 top-24 z-50 flex w-72 flex-col gap-2">
        {error && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-xl dark:border-red-900/30 dark:bg-zinc-950">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-xl dark:border-green-900/30 dark:bg-zinc-950">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}
      </div>

      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{t.title}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Configuration */}
        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.adminPhones}</h2>
            <div className="space-y-3">
              {config?.adminPhoneNumbers.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                  <span className="font-mono text-sm font-medium">{phone}</span>
                  <button onClick={() => setConfig({...config!, adminPhoneNumbers: config!.adminPhoneNumbers.filter((_, i) => i !== idx)})} className="text-zinc-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder={t.placeholderPhone}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button onClick={() => {if(newPhone){setConfig({...config!, adminPhoneNumbers: [...config!.adminPhoneNumbers, newPhone]}); setNewPhone("");}}} className="rounded-xl bg-emerald-600 px-3 py-2 text-white"><Plus className="h-5 w-5" /></button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.template}</h2>
            <p className="mb-4 text-xs text-zinc-500">{t.templateDesc}</p>
            <textarea
              value={config?.templates.contactSubmission}
              onChange={e => setConfig({...config!, templates: { contactSubmission: e.target.value }})}
              rows={4}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50/50 p-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.testSMS}</h2>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder={t.placeholderPhone}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button onClick={handleTestSMS} disabled={testLoading} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {testLoading ? "..." : <Send className="h-4 w-4" />}
              </button>
            </div>
          </section>

          <button onClick={handleSave} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-emerald-600">
            {saving ? "..." : <Save className="h-5 w-5" />}
            <span className="font-bold">{t.save}</span>
          </button>
        </div>

        {/* Right: Submissions List */}
        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t.submissions}</h2>
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "read", "responded"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${filterStatus === s ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"}`}
                >
                  {t[s as keyof typeof t]} ({s === "all" ? submissions.length : submissions.filter(x => x.status === s).length})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="max-h-[600px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-zinc-500">{t.noSubmissions}</div>
                ) : (
                  filtered.map(s => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSubmission(s)}
                      className={`flex w-full flex-col p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${selectedSubmission?._id === s._id ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{s.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${s.status === "new" ? "bg-blue-100 text-blue-600" : s.status === "read" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                          {t[s.status as keyof typeof t]}
                        </span>
                      </div>
                      <span className="truncate text-sm text-zinc-500">{s.subject}</span>
                      <span className="mt-2 text-[10px] text-zinc-400">{new Date(s.createdAt).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedSubmission ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{t.details}</h3>
                  <select
                    value={selectedSubmission.status}
                    onChange={e => handleStatusChange(selectedSubmission._id, e.target.value)}
                    className="rounded-lg border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <option value="new">{t.new}</option>
                    <option value="read">{t.read}</option>
                    <option value="responded">{t.responded}</option>
                  </select>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-900"><User className="h-4 w-4" /></div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">Name</div>
                      <div className="font-bold">{selectedSubmission.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-900"><Mail className="h-4 w-4" /></div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">Email</div>
                      <div className="font-medium text-emerald-600 underline">{selectedSubmission.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-900"><Phone className="h-4 w-4" /></div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">Phone</div>
                      <div className="font-bold">{selectedSubmission.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-zinc-100 p-2 dark:bg-zinc-900"><FileText className="h-4 w-4" /></div>
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">Subject</div>
                      <div className="font-bold">{selectedSubmission.subject}</div>
                      <div className="mt-2 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {selectedSubmission.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-[10px] text-zinc-400">{new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden items-center justify-center rounded-2xl border border-dashed border-zinc-200 xl:flex">
                <p className="text-sm text-zinc-400">Дэлгэрэнгүйг харахын тулд сонгоно уу</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
