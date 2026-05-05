"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

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

export default function SMSConfigPage() {
  const { lang, t } = useAdminLanguage();
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
        setError(t.siteContent.common.forbidden || "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { config: SMSConfig };
      setConfig(json.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load SMS configuration");
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        setError(t.siteContent.common.forbidden || "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      setSuccess("SMS configuration saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save SMS configuration");
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
        setError(t.siteContent.common.forbidden || "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      setSuccess("Test SMS sent successfully");
      setTestPhone("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test SMS");
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SMS Configuration</h1>
        <p className="text-gray-600 mt-2">
          Configure SMS notifications for contact form submissions and other events
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Admin Phone Numbers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Phone Numbers</h2>
        <p className="text-gray-600 text-sm mb-4">
          Phone numbers that will receive SMS notifications
        </p>

        <div className="space-y-3 mb-4">
          {config.adminPhoneNumbers.map((phone, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span className="text-gray-900">{phone}</span>
              <button
                onClick={() => removePhoneNumber(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addPhoneNumber}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
        >
          Add Phone Number
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notificationSettings.sendOnContactSubmission}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notificationSettings: {
                    ...config.notificationSettings,
                    sendOnContactSubmission: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-3 text-gray-900">Send SMS on contact form submission</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notificationSettings.sendOnOrderSubmission}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notificationSettings: {
                    ...config.notificationSettings,
                    sendOnOrderSubmission: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-3 text-gray-900">Send SMS on order submission</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notificationSettings.sendOnJobApplication}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notificationSettings: {
                    ...config.notificationSettings,
                    sendOnJobApplication: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-3 text-gray-900">Send SMS on job application</span>
          </label>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Message Templates</h2>
        <p className="text-gray-600 text-sm mb-4">
          Customize SMS messages. Use {"{name}"}, {"{phone}"}, {"{email}"} as placeholders
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Contact Submission
            </label>
            <textarea
              value={config.templates.contactSubmission}
              onChange={(e) =>
                setConfig({
                  ...config,
                  templates: {
                    ...config.templates,
                    contactSubmission: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Order Submission
            </label>
            <textarea
              value={config.templates.orderSubmission}
              onChange={(e) =>
                setConfig({
                  ...config,
                  templates: {
                    ...config.templates,
                    orderSubmission: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Job Application
            </label>
            <textarea
              value={config.templates.jobApplication}
              onChange={(e) =>
                setConfig({
                  ...config,
                  templates: {
                    ...config.templates,
                    jobApplication: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      {config.stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SMS Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">{config.stats.totalSent}</div>
              <div className="text-sm text-gray-600">Total Sent</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-2xl font-bold text-red-600">{config.stats.totalFailed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Last Sent</div>
              <div className="text-sm font-medium text-gray-900">
                {config.stats.lastSentAt
                  ? new Date(config.stats.lastSentAt).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test SMS</h2>
        <p className="text-gray-600 text-sm mb-4">Send a test SMS to verify configuration</p>

        <div className="flex gap-3">
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Enter phone number (e.g., +97699224455)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestSMS}
            disabled={testLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium"
          >
            {testLoading ? "Sending..." : "Send Test"}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded font-medium"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
