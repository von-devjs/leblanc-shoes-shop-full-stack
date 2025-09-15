import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import { api } from "../../api";

interface RawMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  sender: "user" | "admin" | string;
  is_read: number;
  submitted_at: string;
}

interface Thread {
  email: string;
  name: string;
  latestMessage: string;
  latestAt: string;
  unreadCount: number;
  lastSender: "user" | "admin" | string;
}

const Messages: React.FC = () => {
  const [rawMessages, setRawMessages] = useState<RawMessage[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeChatEmail, setActiveChatEmail] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string | null>(null);

  const navigate = useNavigate();

  // ---- Fetch messages from backend ----
  const fetchRawMessages = useCallback(async () => {
    setLoading(true);
    try {
      const messages = await api.getAdminMessages();
      setRawMessages(messages);
      setError(null);
    } catch (err: any) {
      console.error("fetchRawMessages error", err);
      setError(err?.message || "Failed to fetch messages");
      setRawMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRawMessages();
  }, [fetchRawMessages]);

  // ---- Derive threads grouped by email ----
  useEffect(() => {
    const grouped = new Map<
      string,
      { latest: RawMessage | null; unread: number; name: string }
    >();

    rawMessages.forEach((m) => {
      const key = m.email || "unknown";
      const entry =
        grouped.get(key) || { latest: null, unread: 0, name: m.name || "Unknown" };

      // count unread user messages
      if (m.sender === "user" && Number(m.is_read) === 0) {
        entry.unread += 1;
      }

      // pick the latest message
      if (
        !entry.latest ||
        new Date(m.submitted_at) > new Date(entry.latest.submitted_at)
      ) {
        entry.latest = m;
        entry.name = m.name || entry.name;
      }

      grouped.set(key, entry);
    });

    const out: Thread[] = [];
    grouped.forEach((v, email) => {
      out.push({
        email,
        name: v.name,
        latestMessage: v.latest ? v.latest.message : "",
        latestAt: v.latest ? v.latest.submitted_at : "",
        unreadCount: v.unread,
        lastSender: v.latest ? v.latest.sender : "user",
      });
    });

    // sort threads by latest message date
    out.sort(
      (a, b) =>
        new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    );

    setThreads(out);
  }, [rawMessages]);

  // ---- Open/Close Chat ----
  const openChat = (thread: Thread) => {
    if (!thread.email) {
      alert("Cannot open chat: missing email");
      return;
    }
    setActiveChatEmail(thread.email);
    setActiveChatName(thread.name);
  };

  const onChatClose = () => {
    setActiveChatEmail(null);
    setActiveChatName(null);
    // refresh thread list (to update unread counts)
    fetchRawMessages();
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="px-4 py-2 bg-purple-800 hover:bg-purple-500 text-white rounded-lg shadow w-fit cursor-pointer">
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customer Messages</h1>
        <button
          onClick={fetchRawMessages}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow cursor-pointer">
          Refresh
        </button>
      </div>

      {/* Loading/Error */}
      {loading && <p className="text-gray-400 p-6">Loading messages...</p>}
      {error && <p className="text-red-400 p-6">{error}</p>}

      {/* Threads */}
      {!loading && !error && (
        <>
          {threads.length === 0 ? (
            <p className="text-gray-400">No message threads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 text-white border border-gray-700 rounded-lg">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">From</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Latest Message</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((t) => (
                    <tr
                      key={t.email}
                      onClick={() => openChat(t)}
                      className={`border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer ${
                        t.unreadCount > 0 ? "bg-gray-900 font-semibold" : ""
                      }`}>
                      <td className="py-3 px-4">{t.name}</td>
                      <td className="py-3 px-4">{t.email}</td>
                      <td className="py-3 px-4 truncate max-w-xs">
                        {t.latestMessage.length > 70
                          ? t.latestMessage.slice(0, 70) + "..."
                          : t.latestMessage}
                      </td>
                      <td className="py-3 px-4">
                        {t.unreadCount > 0 ? (
                          <span className="text-yellow-400">
                            {t.unreadCount} unread
                          </span>
                        ) : t.lastSender === "admin" ? (
                          <span className="text-blue-400">Admin Reply</span>
                        ) : (
                          <span className="text-green-400">Read</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(t.latestAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ChatBox */}
      {activeChatEmail && activeChatName && (
        <ChatBox
          userName={activeChatName}
          userEmail={activeChatEmail}
          onClose={onChatClose}
        />
      )}
    </div>
  );
};

export default Messages;
