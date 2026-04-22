"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "../../../lib/api";
import { getStoredUser } from "../../../lib/auth";
import StatusCard from "../../../components/StatusCard";

type StoredUser = {
  username: string;
  role: string;
};

type RawMessage = Record<string, unknown>;

type MessageItem = {
  id: number | string;
  senderUsername: string;
  senderRole: string;
  content: string;
  createdAt: string;
  isMine: boolean;
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

function normalizeMessages(data: unknown): RawMessage[] {
  if (Array.isArray(data)) return data as RawMessage[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.results)) return obj.results as RawMessage[];
    if (Array.isArray(obj.messages)) return obj.messages as RawMessage[];
    if (Array.isArray(obj.thread)) return obj.thread as RawMessage[];
    if (Array.isArray(obj.conversation)) return obj.conversation as RawMessage[];
  }

  return [];
}

function formatDate(dateString: string) {
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString();
}

function mapRawMessage(item: RawMessage, currentUsername: string): MessageItem {
  const rawId = item.id ?? item.message_id ?? item.pk;
  const id: number | string =
    typeof rawId === "number" || typeof rawId === "string"
      ? rawId
      : Math.random().toString(36).slice(2);

  const senderUsername =
    asString(item.sender_username) ||
    asString(item.sender) ||
    asString(item.from_username) ||
    asString(item.username) ||
    "Unknown user";

  const senderRole =
    asString(item.sender_role) ||
    asString(item.role) ||
    asString(item.user_role);

  const content =
    asString(item.content) ||
    asString(item.message) ||
    asString(item.body) ||
    asString(item.text) ||
    "";

  const createdAt =
    asString(item.created_at) ||
    asString(item.sent_at) ||
    asString(item.timestamp);

  return {
    id,
    senderUsername,
    senderRole,
    content,
    createdAt,
    isMine: senderUsername === currentUsername,
  };
}

export default function MessageThreadPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const threadId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setUserChecked(true);

    if (!storedUser || !threadId) {
      setLoading(false);
      return;
    }

    authFetch(`http://127.0.0.1:8000/api/profiles/messages/${threadId}/`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);

        if (!res.ok) {
          throw new Error(data?.error || "Could not load conversation.");
        }

        return data;
      })
      .then((data) => {
        const mapped = normalizeMessages(data).map((item) =>
          mapRawMessage(item, storedUser.username)
        );

        mapped.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        });

        setMessages(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not load conversation.");
        setLoading(false);
      });
  }, [threadId]);

  const otherParticipant = useMemo(() => {
    if (!user) return "";
    const other = messages.find((message) => !message.isMine);
    return other?.senderUsername || "";
  }, [messages, user]);

  if (!userChecked) {
    return null;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-4xl">
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

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              {otherParticipant ? `Chat with ${otherParticipant}` : "Conversation"}
            </h1>
            <p className="mt-1 text-slate-300">
              Review your conversation history.
            </p>
          </div>

          <Link
            href="/messages"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Back to Messages
          </Link>
        </div>

        {loading ? (
          <StatusCard
            title="Loading Conversation"
            message="Please wait while messages are loading."
            variant="info"
          />
        ) : error ? (
          <StatusCard
            title="Error"
            message={error}
            variant="error"
            actionHref="/messages"
            actionLabel="Back to Messages"
          />
        ) : messages.length === 0 ? (
          <StatusCard
            title="No Messages Yet"
            message="This conversation does not contain any messages yet."
            variant="neutral"
            actionHref="/messages"
            actionLabel="Back to Messages"
          />
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm">
            <div className="space-y-4">
              {messages.map((message) => {
                return (
                  <div
                    key={String(message.id)}
                    className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.isMine
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
                        <span className="font-semibold">
                          {message.isMine ? "You" : message.senderUsername}
                        </span>

                        {message.senderRole && !message.isMine && (
                          <span className="rounded-full border border-white/20 px-2 py-0.5">
                            {message.senderRole}
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {message.content || "No content."}
                      </p>

                      <p
                        className={`mt-2 text-right text-xs ${
                          message.isMine ? "text-blue-100" : "text-slate-300"
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}