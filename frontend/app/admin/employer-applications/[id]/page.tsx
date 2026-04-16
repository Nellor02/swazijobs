"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStoredUser } from "../../../../lib/auth";
import { authFetch } from "../../../../lib/api";
import StatusCard from "../../../../components/StatusCard";

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

export default function AdminEmployerApplicationDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const applicationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  const [application, setApplication] = useState<EmployerApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "admin" || !applicationId) {
      setLoading(false);
      return;
    }

    authFetch(`http://127.0.0.1:8000/api/accounts/admin/employer-applications/${applicationId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(
            data?.error || "Could not load employer application detail."
          );
        }

        return data;
      })
      .then((data: EmployerApplication) => {
        setApplication(data);
        setAdminNotes(data.admin_notes || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load employer application detail."
        );
        setLoading(false);
      });
  }, [applicationId]);

  async function handleReview(statusValue: "approved" | "rejected") {
    if (!application) return;

    setReviewing(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(
        `http://127.0.0.1:8000/api/accounts/admin/employer-applications/${application.id}/review/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: statusValue,
            admin_notes: adminNotes,
          }),
        }
      );

      const data = await parseResponseSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to review employer application.");
      }

      setApplication(data as EmployerApplication);
      setAdminNotes((data as EmployerApplication).admin_notes || "");
      setSuccess(
        statusValue === "approved"
          ? "Employer application approved."
          : "Employer application rejected."
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to review employer application."
      );
    } finally {
      setReviewing(false);
    }
  }

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
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
        <div className="mx-auto max-w-5xl">
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

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Employer Application Review
            </h1>
            <p className="mt-1 text-slate-300">
              Review company details and approve or reject the request.
            </p>
          </div>

          <Link
            href="/admin/employer-applications"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Review Dashboard
          </Link>
        </div>

        {success && (
          <div className="mb-6">
            <StatusCard title="Success" message={success} variant="success" />
          </div>
        )}

        {loading ? (
          <StatusCard
            title="Loading Application"
            message="Please wait while application details are being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/admin/employer-applications"
            actionLabel="Back to Review Dashboard"
          />
        ) : !application ? (
          <StatusCard
            title="Application Not Found"
            message="This employer application does not exist."
            variant="neutral"
            actionHref="/admin/employer-applications"
            actionLabel="Back to Review Dashboard"
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-100">
                  {application.company_name}
                </h2>

                <span
                  className={`rounded px-3 py-1 text-sm font-semibold uppercase tracking-wide ${getStatusClasses(
                    application.status
                  )}`}
                >
                  {formatStatus(application.status)}
                </span>
              </div>

              <p className="mt-2 text-slate-300">
                Submitted by {application.username} ({application.email})
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                  Submitted: {new Date(application.submitted_at).toLocaleString()}
                </span>

                {application.reviewed_at && (
                  <span className="rounded border border-slate-600 bg-slate-700 px-3 py-1">
                    Reviewed: {new Date(application.reviewed_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
                <h3 className="mb-3 text-xl font-semibold text-slate-100">
                  Company Details
                </h3>

                <div className="space-y-3 text-slate-300">
                  <p><span className="font-semibold text-slate-100">Company Email:</span> {application.company_email}</p>
                  <p><span className="font-semibold text-slate-100">Company Phone:</span> {application.company_phone}</p>
                  <p><span className="font-semibold text-slate-100">Website:</span> {application.company_website || "Not provided"}</p>
                  <p><span className="font-semibold text-slate-100">Registration Number:</span> {application.company_registration_number || "Not provided"}</p>
                  <p><span className="font-semibold text-slate-100">Address:</span> {application.company_address}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
                <h3 className="mb-3 text-xl font-semibold text-slate-100">
                  Contact Person
                </h3>

                <div className="space-y-3 text-slate-300">
                  <p><span className="font-semibold text-slate-100">Name:</span> {application.contact_person_name}</p>
                  <p><span className="font-semibold text-slate-100">Position:</span> {application.contact_person_position || "Not provided"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-slate-100">
                Business Description
              </h3>
              <p className="whitespace-pre-line text-slate-200">
                {application.business_description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-slate-100">
                Supporting Note
              </h3>
              <p className="whitespace-pre-line text-slate-200">
                {application.supporting_note || "No supporting note provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-100">
                  Admin Review
                </h3>
              </div>

              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-blue-500"
                placeholder="Add admin notes for the employer applicant..."
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => handleReview("approved")}
                  disabled={reviewing}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {reviewing ? "Processing..." : "Approve"}
                </button>

                <button
                  onClick={() => handleReview("rejected")}
                  disabled={reviewing}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {reviewing ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}