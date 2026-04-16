"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type EmployerApplication = {
  id: number;
  user: number;
  username: string;
  email: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  company_registration_number: string;
  company_address: string;
  business_description: string;
  contact_person_name: string;
  contact_person_position: string;
  supporting_note: string;
  status: string;
  admin_notes: string;
  submitted_at: string;
  reviewed_at: string | null;
};

type StoredUser = {
  username: string;
  role: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function getStatusClasses(status: string) {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-green-900 text-green-200 border border-green-700";
    case "rejected":
      return "bg-red-900 text-red-200 border border-red-700";
    case "pending":
    default:
      return "bg-yellow-900 text-yellow-200 border border-yellow-700";
  }
}

function formatStatus(status: string) {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "pending":
    default:
      return "Pending";
  }
}

function truncateText(text?: string, maxLength = 180) {
  if (!text) return "No details provided.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function AdminEmployerApplicationsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "admin") {
      setLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/accounts/admin/employer-applications/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(
            data?.error || "Could not load employer applications."
          );
        }

        return data;
      })
      .then((data: EmployerApplication[]) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load employer applications."
        );
        setLoading(false);
      });
  }, []);

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to access employer application reviews."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl">
          <StatusCard
            title="Access Restricted"
            message="Only admins can access employer application reviews."
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Employer Review Dashboard
            </h1>
            <p className="mt-1 text-slate-300">
              Review and manage employer account applications.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Home
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Pending</p>
            <h2 className="text-2xl font-bold text-yellow-300">{pendingCount}</h2>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Approved</p>
            <h2 className="text-2xl font-bold text-green-300">{approvedCount}</h2>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-400">Rejected</p>
            <h2 className="text-2xl font-bold text-red-300">{rejectedCount}</h2>
          </div>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Applications"
            message="Please wait while employer applications are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : applications.length === 0 ? (
          <StatusCard
            title="No Employer Applications"
            message="There are no employer applications to review yet."
            variant="neutral"
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/employer-applications/${application.id}`}
                        className="text-2xl font-semibold text-blue-400 hover:underline"
                      >
                        {application.company_name}
                      </Link>

                      <span
                        className={`rounded px-3 py-1 text-sm font-semibold uppercase tracking-wide ${getStatusClasses(
                          application.status
                        )}`}
                      >
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-300">
                      Applicant: {application.username} • {application.email}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        Contact: {application.contact_person_name}
                      </span>

                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        Company Email: {application.company_email}
                      </span>

                      <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                        Submitted: {new Date(application.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                        Business Description Preview
                      </h3>
                      <p className="whitespace-pre-line text-slate-200">
                        {truncateText(application.business_description)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:ml-6">
                    <Link
                      href={`/admin/employer-applications/${application.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Review Application
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}