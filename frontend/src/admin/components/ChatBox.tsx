import React, { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../../api";

interface ChatMessage {
  id: number;
  sender: "user" | "admin";
  message: string;
  submitted_at: string;
  is_read?: 0 | 1;
}

interface ChatBoxProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ userName, userEmail, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ---- Auto-scroll helper ----
  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // ---- Fetch messages ----
  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getChatByEmail(userEmail);
      setMessages(
        data.map((m) => ({
          id: Number(m.id),
          sender: m.sender === "admin" ? "admin" : "user",
          message: m.message,
          submitted_at: m.submitted_at,
          is_read: m.is_read,
        }))
      );
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, scrollToBottom]);

  // ---- Initial load + mark messages as read ----
  useEffect(() => {
    setLoading(true);
    fetchMessages();
    // Mark user's messages as read when admin opens the chat
    api.markMessagesRead(userEmail).catch((err) =>
      console.error("Failed to mark messages as read:", err)
    );
  }, [userEmail, fetchMessages]);

  // ---- Send a reply ----
  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await api.sendAdminMessage(userEmail, input.trim());
      setInput("");
      await fetchMessages(); // refresh chat after sending
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert(err?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-800 text-white rounded-xl shadow-lg w-full max-w-lg flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="font-bold text-lg">
            Chat with {userName} ({userEmail})
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white cursor-pointer">
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading ? (
            <p className="text-gray-400">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-400">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] p-3 rounded-lg break-words ${
                  msg.sender === "admin"
                    ? "bg-purple-800 self-end"
                    : "bg-gray-700 self-start"
                }`}>
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs text-gray-300 mt-1 block">
                  {new Date(msg.submitted_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex p-4 gap-2 border-t border-gray-700">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            className={`px-4 py-2 rounded-lg font-bold cursor-pointer ${
              sending
                ? "opacity-60 cursor-not-allowed"
                : "bg-purple-800 hover:bg-purple-600"
            }`}
            disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
