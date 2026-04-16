"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "../../../lib/auth";
import { authFetch } from "../../../lib/api";
import StatusCard from "../../../components/StatusCard";

type EmployerApplication = {
  id: number;
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

export default function EmployerApplicationStatusPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [application, setApplication] = useState<EmployerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || storedUser.role !== "employer") {
      setLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/accounts/employer-application/me/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load employer application status.");
        }

        return data;
      })
      .then((data: EmployerApplication) => {
        setApplication(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load employer application status."
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
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view this page."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (user.role !== "employer") {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Access Restricted"
            message="This page is only for employer account applications."
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
              Employer Application Status
            </h1>
            <p className="mt-1 text-slate-300">
              Track the review status of your employer account request.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Home
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Application Status"
            message="Please wait while your employer application is being loaded."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
          />
        ) : !application ? (
          <StatusCard
            title="Application Not Found"
            message="No employer application was found for this account."
            variant="neutral"
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
                  {application.status}
                </span>
              </div>

              <p className="mt-2 text-slate-300">
                Submitted on {new Date(application.submitted_at).toLocaleString()}
              </p>

              {application.reviewed_at && (
                <p className="mt-1 text-slate-400">
                  Reviewed on {new Date(application.reviewed_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <h3 className="mb-3 text-xl font-semibold text-slate-100">
                Application Summary
              </h3>

              <div className="space-y-3 text-slate-300">
                <p><span className="font-semibold text-slate-100">Company Email:</span> {application.company_email}</p>
                <p><span className="font-semibold text-slate-100">Company Phone:</span> {application.company_phone}</p>
                <p><span className="font-semibold text-slate-100">Contact Person:</span> {application.contact_person_name}</p>
                <p><span className="font-semibold text-slate-100">Position:</span> {application.contact_person_position || "Not provided"}</p>
                <p><span className="font-semibold text-slate-100">Website:</span> {application.company_website || "Not provided"}</p>
                <p><span className="font-semibold text-slate-100">Registration Number:</span> {application.company_registration_number || "Not provided"}</p>
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
                Admin Notes
              </h3>

              <p className="whitespace-pre-line text-slate-200">
                {application.admin_notes || "No admin notes yet."}
              </p>
            </div>

            {application.status === "approved" ? (
              <StatusCard
                title="Approved"
                message="Your employer application has been approved. You can now continue to the employer dashboard."
                variant="success"
                actionHref="/employer/jobs"
                actionLabel="Go to Employer Dashboard"
              />
            ) : application.status === "rejected" ? (
              <StatusCard
                title="Application Rejected"
                message="Your employer application was not approved. Review the admin notes above."
                variant="error"
              />
            ) : (
              <StatusCard
                title="Pending Review"
                message="Your employer application is still under review. Please check back later."
                variant="warning"
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}