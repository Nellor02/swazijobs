"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusCard from "./StatusCard";
import { getStoredUser } from "../lib/auth";

type AllowedRole = "seeker" | "employer" | "admin";

type StoredUser = {
  username: string;
  role: string;
};

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
  redirectTo?: string;
  loadingTitle?: string;
  loadingMessage?: string;
  unauthorizedTitle?: string;
  unauthorizedMessage?: string;
};

export default function AuthGuard({
  children,
  allowedRoles,
  redirectTo = "/login",
  loadingTitle = "Checking Access",
  loadingMessage = "Please wait while we verify your session.",
  unauthorizedTitle = "Access Restricted",
  unauthorizedMessage = "You do not have permission to view this page.",
}: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setChecked(true);

    if (!storedUser) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(storedUser.role as AllowedRole)) {
      return;
    }
  }, [allowedRoles, redirectTo, router]);

  if (!checked) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title={loadingTitle}
            message={loadingMessage}
            variant="info"
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to continue."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role as AllowedRole)) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
          <StatusCard
            title={unauthorizedTitle}
            message={unauthorizedMessage}
            variant="error"
            actionHref="/"
            actionLabel="Back to Home"
          />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}