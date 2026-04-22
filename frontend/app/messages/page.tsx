"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import StatusCard from "../../components/StatusCard";

type StoredUser = {
  username: string;
  role: string;
};

type RawConversation = Record<string, unknown>;

type ConversationCard = {
  id: number | string;
  title: string;
  subtitle: string;
  preview: string;
  unread: boolean;
  updatedAt: string;
  href: string;
};

async function parseResponseSafely(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  const text = await res.text();
  return { error: text || `Request failed with status ${res.status}` };
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function formatDate(dateString: string) {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

function truncateText(text: string, maxLength = 140) {
  if (!text) return "No messages yet.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function normalizeConversations(data: unknown): RawConversation[] {
  if (Array.isArray(data)) return data as RawConversation[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.results)) return obj.results as RawConversation[];
    if (Array.isArray(obj.conversations)) return obj.conversations as RawConversation[];
    if (Array.isArray(obj.messages)) return obj.messages as RawConversation[];
    if (Array.isArray(obj.threads)) return obj.threads as RawConversation[];
  }

  return [];
}

function mapConversationToCard(item: RawConversation): ConversationCard {
  const rawId =
    item.id ??
    item.thread_id ??
    item.conversation_id ??
    item.message_thread_id;

  const id: number | string =
    typeof rawId === "number" || typeof rawId === "string"
      ? rawId
      : Math.random().toString(36).slice(2);

  const otherUser =
    asString(item.other_user_username) ||
    asString(item.other_username) ||
    asString(item.recipient_username) ||
    asString(item.sender_username) ||
    asString(item.username);

  const title =
    asString(item.title) ||
    otherUser ||
    asString(item.subject) ||
    "Conversation";

  const subtitle =
    asString(item.role_label) ||
    asString(item.other_user_role) ||
    asString(item.participant_label) ||
    (otherUser ? `with ${otherUser}` : "Direct message");

  const preview =
    asString(item.last_message) ||
    asString(item.preview) ||
    asString(item.message) ||
    asString(item.body) ||
    asString(item.content) ||
    "No messages yet.";

  const unread =
    asBoolean(item.is_unread) ||
    asBoolean(item.unread) ||
    asNumber(item.unread_count) > 0;

  const updatedAt =
    asString(item.updated_at) ||
    asString(item.last_message_at) ||
    asString(item.created_at);

  const hrefId = encodeURIComponent(String(id));
  const href = `/messages/${hrefId}`;

  return {
    id,
    title,
    subtitle,
    preview: truncateText(preview),
    unread,
    updatedAt,
    href,
  };
}

export default function MessagesPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [cards, setCards] = useState<ConversationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser) {
      setLoading(false);
      return;
    }

    authFetch("http://127.0.0.1:8000/api/profiles/messages/")
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load messages.");
        }

        return data;
      })
      .then((data) => {
        const rows = normalizeConversations(data).map(mapConversationToCard);

        rows.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        setCards(rows);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load messages.");
        setLoading(false);
      });
  }, []);

  const unreadCount = useMemo(
    () => cards.filter((card) => card.unread).length,
    [cards]
  );

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <StatusCard
            title="Login Required"
            message="You must be logged in to view messages."
            variant="warning"
            actionHref="/login"
            actionLabel="Go to Login"
          />
        </div>
      </main>
    );
  }

  const backHref =
    user.role === "employer" || user.role === "admin" ? "/employer/jobs" : "/";

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Messages</h1>
            <p className="mt-1 text-slate-300">
              {unreadCount > 0
                ? `You have ${unreadCount} unread conversation${unreadCount !== 1 ? "s" : ""}.`
                : "Review your conversations with candidates and employers."}
            </p>
          </div>

          <Link
            href={backHref}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Messages"
            message="Please wait while your conversations are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard title="Error" message={error} variant="error" />
        ) : cards.length === 0 ? (
          <StatusCard
            title="No Conversations Yet"
            message="Your messages will appear here once you start communicating."
            variant="neutral"
            actionHref={backHref}
            actionLabel="Go Back"
          />
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={String(card.id)}
                className={`rounded-xl border p-6 shadow-sm ${
                  card.unread
                    ? "border-blue-700 bg-slate-800"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-slate-100">
                        {card.title}
                      </h2>

                      {card.unread && (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400">{card.subtitle}</p>

                    <p className="mt-3 text-slate-300">{card.preview}</p>

                    <p className="mt-3 text-sm text-slate-400">
                      {formatDate(card.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={card.href}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Open Chat
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