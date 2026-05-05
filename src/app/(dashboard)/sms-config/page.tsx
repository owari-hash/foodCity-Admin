"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  readClientAdminProfile,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Phone, Trash2, Plus, CheckCircle2, AlertCircle, Save, MessageSquare, Clock, User, Mail, FileText } from "lucide-react";

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
    description: "Хэрэглэгчдийн санал хүсэлт",
    adminPhones: "Мэдэгдэл хүлээн авах дугаарууд",
    adminPhonesDesc: "Шинэ санал ирэхэд SMS очих дугаарууд",
    addPhone: "Нэмэх",
    template: "SMS загвар",
    templateDesc: "Загвар: {name}, {phone}, {email}, {subject}",
    submissions: "Санал хүсэлтийн жагсаалт",
    noSubmissions: "Одоогоор санал хүсэлт ирээгүй байна",
    details: "Дэлгэрэнгүй",
    status: "Төлөв",
    save: "Хадгалах",
    loading: "Уншиж байна...",
    saved: "Амжилттай хадгалагдлаа",
    placeholderPhone: "+976...",
    all: "Бүгд",
    new: "Шинэ",
    read: "Уншсан",
    responded: "Хариулсан",
  },
  en: {
    title: "Messages & Feedback",
    description: "User submissions",
    adminPhones: "Notification Numbers",
    adminPhonesDesc: "Phone numbers for SMS alerts",
    addPhone: "Add",
    template: "SMS Template",
    templateDesc: "Placeholders: {name}, {phone}, {email}, {subject}",
    submissions: "Submissions List",
    noSubmissions: "No submissions found",
    details: "Details",
    status: "Status",
    save: "Save Config",
    loading: "Loading...",
    saved: "Saved successfully",
    placeholderPhone: "+976...",
    all: "All",
    new: "New",
    read: "Read",
    responded: "Responded",
  },
};

export default function SMSConfigPage() {
  const { lang } = useAdminLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "read" | "responded">("all");
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

  const handleAddPhone = () => {
    if (!newPhone.trim() || !config) return;
    if (config.adminPhoneNumbers.includes(newPhone.trim())) {
      setError("Phone number already exists");
      return;
    }
    setConfig({
      ...config,
      adminPhoneNumbers: [...config.adminPhoneNumbers, newPhone.trim()]
    });
    setNewPhone("");
  };

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

  const filtered = filterStatus === "all" ? submissions : submissions.filter(s => s.status === filterStatus);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800"></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Alerts */}
      <div className="fixed right-8 top-24 z-50 flex w-72 flex-col gap-2">
        {error && (
          <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <AlertCircle className="h-5 w-5 text-zinc-500" />
            <p className="text-sm text-zinc-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-zinc-800" />
            <p className="text-sm text-zinc-800">{success}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl font-medium text-zinc-900">{t.title}</h1>
          <p className="text-sm text-zinc-500">{t.description}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "..." : t.save}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Configuration */}
        <div className="space-y-6 lg:col-span-4">
          <section className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/30 p-5">
            <h2 className="text-sm font-medium text-zinc-900">{t.adminPhones}</h2>
            <div className="space-y-2">
              {config?.adminPhoneNumbers.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-zinc-100">
                  <span className="text-sm text-zinc-600">{phone}</span>
                  <button onClick={() => setConfig({...config!, adminPhoneNumbers: config!.adminPhoneNumbers.filter((_, i) => i !== idx)})} className="text-zinc-400 hover:text-zinc-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPhone()}
                  placeholder={t.placeholderPhone}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 transition-colors"
                />
                <button 
                  onClick={handleAddPhone} 
                  className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-600 hover:bg-zinc-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/30 p-5">
            <h2 className="text-sm font-medium text-zinc-900">{t.template}</h2>
            <textarea
              value={config?.templates.contactSubmission}
              onChange={e => setConfig({...config!, templates: { contactSubmission: e.target.value }})}
              rows={4}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-zinc-400 transition-colors"
            />
            <p className="text-[11px] text-zinc-400">{t.templateDesc}</p>
          </section>
        </div>

        {/* Right: Submissions List */}
        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "read", "responded"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-4 py-1.5 text-xs transition-all ${filterStatus === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
                >
                  {t[s as keyof typeof t]} ({s === "all" ? submissions.length : submissions.filter(x => x.status === s).length})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-white">
              <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-50">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-xs text-zinc-400">{t.noSubmissions}</div>
                ) : (
                  filtered.map(s => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSubmission(s)}
                      className={`flex w-full flex-col p-4 text-left transition-colors hover:bg-zinc-50 ${selectedSubmission?._id === s._id ? "bg-zinc-50" : ""}`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-900">{s.name || s.phone}</span>
                        <span className={`text-[10px] ${s.status === "new" ? "text-blue-500" : s.status === "read" ? "text-amber-500" : "text-emerald-500"}`}>
                          {t[s.status as keyof typeof t]}
                        </span>
                      </div>
                      <span className="truncate text-xs text-zinc-500">{s.subject || s.message.substring(0, 50)}</span>
                      <span className="mt-2 text-[10px] text-zinc-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedSubmission ? (
              <div className="rounded-xl border border-zinc-100 bg-white p-6">
                <div className="mb-6 flex items-center justify-between border-b border-zinc-50 pb-4">
                  <h3 className="text-sm font-medium text-zinc-900">{t.details}</h3>
                  <select
                    value={selectedSubmission.status}
                    onChange={e => handleStatusChange(selectedSubmission._id, e.target.value)}
                    className="rounded border-none bg-zinc-50 px-2 py-1 text-[11px] outline-none"
                  >
                    <option value="new">{t.new}</option>
                    <option value="read">{t.read}</option>
                    <option value="responded">{t.responded}</option>
                  </select>
                </div>

                <div className="space-y-5">
                  {selectedSubmission.name && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-zinc-400" />
                      <div className="text-sm text-zinc-600">{selectedSubmission.name}</div>
                    </div>
                  )}
                  {selectedSubmission.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <div className="text-sm text-zinc-600 underline">{selectedSubmission.email}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <div className="text-sm text-zinc-600">{selectedSubmission.phone}</div>
                  </div>
                  <div className="space-y-2 border-t border-zinc-50 pt-4">
                    <div className="text-[11px] text-zinc-400">Message</div>
                    <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 leading-relaxed">
                      {selectedSubmission.message}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[10px] text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden items-center justify-center rounded-xl border border-dashed border-zinc-100 xl:flex">
                <p className="text-xs text-zinc-400">Сонгоно уу</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
