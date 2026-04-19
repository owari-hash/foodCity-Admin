"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api";

type Conv = {
  id: string;
  guestId: string;
  displayName?: string;
  humanMode: boolean;
  status: string;
  updatedAt?: string;
};

type Msg = {
  id: string;
  role: string;
  text: string;
  createdAt?: string;
};

export default function ChatAdminPage() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const base = getApiBaseUrl();

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/v1/admin/conversations`);
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Conv[] };
      setConversations(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }, [base]);

  const loadMessages = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${base}/api/v1/admin/conversations/${id}/messages`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { data: Msg[] };
        setMessages(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа");
      }
    },
    [base],
  );

  useEffect(() => {
    void loadConversations();
    const t = setInterval(() => void loadConversations(), 15000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    const s = io(base, { transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.on(
      "message:new",
      (payload: { conversationId?: string; message?: Msg }) => {
        if (!payload?.conversationId || !payload?.message) return;
        if (selected?.id === payload.conversationId) {
          setMessages((prev) => {
            const id = payload.message!.id;
            if (prev.some((m) => m.id === id)) return prev;
            return [...prev, payload.message!];
          });
        }
        void loadConversations();
      },
    );
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [base, selected?.id, loadConversations]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selected) return;
    const convId = selected.id;
    const run = () => {
      socket.emit(
        "join",
        { conversationId: convId, asAdmin: true },
        (err: Error | null) => {
          if (err) setError(err.message);
        },
      );
    };
    if (socket.connected) run();
    else socket.once("connect", run);
    return () => {
      socket.off("connect", run);
    };
  }, [selected]);

  useEffect(() => {
    if (selected) void loadMessages(selected.id);
  }, [selected, loadMessages]);

  async function sendAgent() {
    if (!selected || !input.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${base}/api/v1/admin/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Msg };
      setMessages((prev) => [...prev, json.data]);
      setInput("");
      void loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }

  async function setHumanMode(humanMode: boolean) {
    if (!selected) return;
    try {
      const res = await fetch(`${base}/api/v1/admin/conversations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humanMode }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Conv };
      setSelected(json.data);
      void loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-4">
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="w-72 shrink-0 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="px-2 py-1 text-xs font-medium text-zinc-500">Яриа</p>
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              selected?.id === c.id
                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <div className="font-medium truncate">
              {c.displayName || c.guestId.slice(0, 8)}
            </div>
            <div className="text-xs text-zinc-500">
              {c.humanMode ? "Ажилтан" : "Бот"} · {c.status}
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="px-2 text-sm text-zinc-500">Яриа алга</p>
        )}
      </div>

      <div className="flex min-h-[420px] min-w-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-zinc-500">
            Зүүн талаас яриа сонгоно уу
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <span className="text-sm font-medium">{selected.displayName || selected.guestId}</span>
              <button
                type="button"
                onClick={() => setHumanMode(!selected.humanMode)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
              >
                {selected.humanMode ? "Бот руу буцаах" : "Ажилтан авах (бот унтраах)"}
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "user" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : m.role === "agent"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-50"
                    }`}
                  >
                    <span className="mb-0.5 block text-[10px] uppercase opacity-70">
                      {m.role}
                    </span>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendAgent()}
                placeholder="Хариу бичих…"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => void sendAgent()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Илгээх
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
