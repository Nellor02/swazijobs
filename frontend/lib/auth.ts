type StoredUser = {
  username: string;
  role: string;
};

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.username !== "string" ||
      typeof parsed.role !== "string"
    ) {
      localStorage.removeItem("user");
      return null;
    }

    return {
      username: parsed.username,
      role: parsed.role,
    };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}