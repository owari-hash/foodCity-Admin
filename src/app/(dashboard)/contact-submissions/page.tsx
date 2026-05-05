"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

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

export default function ContactSubmissionsPage() {
  const { lang, t } = useAdminLanguage();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "read" | "responded">("all");

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/contact/submissions"),
        withClientAdminAuth()
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden || "Permission denied");
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { submissions: ContactSubmission[] };
      setSubmissions(json.submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/contact/submissions/${submissionId}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...withClientAdminAuth().headers,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const gate = await ensureClientAuthorized(res);
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      // Update local state
      setSubmissions(
        submissions.map((s) =>
          s._id === submissionId ? { ...s, status: newStatus as any } : s
        )
      );

      if (selectedSubmission?._id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus as any });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const filteredSubmissions =
    filterStatus === "all"
      ? submissions
      : submissions.filter((s) => s.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "read":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
        <p className="text-gray-600 mt-2">
          View and manage contact form submissions from your website
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "new", "read", "responded"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} (
            {status === "all"
              ? submissions.length
              : submissions.filter((s) => s.status === status).length}
            )
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No submissions found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <button
                    key={submission._id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedSubmission?._id === submission._id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{submission.name}</div>
                        <div className="text-sm text-gray-600 truncate">{submission.email}</div>
                        <div className="text-sm text-gray-600 truncate">{submission.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(submission.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submission Details */}
        {selectedSubmission && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Name</label>
                <div className="text-gray-900">{selectedSubmission.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <a
                  href={`mailto:${selectedSubmission.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {selectedSubmission.email}
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Phone</label>
                <a
                  href={`tel:${selectedSubmission.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {selectedSubmission.phone}
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Subject</label>
                <div className="text-gray-900">{selectedSubmission.subject}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Message</label>
                <div className="bg-gray-50 p-3 rounded text-gray-900 whitespace-pre-wrap text-sm">
                  {selectedSubmission.message}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                <select
                  value={selectedSubmission.status}
                  onChange={(e) =>
                    handleStatusChange(selectedSubmission._id, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="responded">Responded</option>
                </select>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                <div>Submitted: {new Date(selectedSubmission.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(selectedSubmission.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
