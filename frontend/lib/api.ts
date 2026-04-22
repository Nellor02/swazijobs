import { clearStoredAuth } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
}

function redirectToLoginIfNeeded() {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  const publicPaths = ["/", "/login", "/register"];

  if (!publicPaths.includes(path)) {
    window.location.href = "/login";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.access) {
      clearStoredAuth();
      redirectToLoginIfNeeded();
      return null;
    }

    setAccessToken(data.access);
    return data.access;
  } catch {
    clearStoredAuth();
    redirectToLoginIfNeeded();
    return null;
  }
}

export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url =
    input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `${API_BASE_URL}${input.startsWith("/") ? input : `/${input}`}`;

  let response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status !== 401) {
    return response;
  }

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) {
    return response;
  }

  const retryHeaders = new Headers(init.headers || {});
  if (!retryHeaders.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    retryHeaders.set("Content-Type", "application/json");
  }
  retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

  response = await fetch(url, {
    ...init,
    headers: retryHeaders,
  });

  if (response.status === 401) {
    clearStoredAuth();
    redirectToLoginIfNeeded();
  }

  return response;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}