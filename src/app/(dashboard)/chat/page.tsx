"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
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
  const selectedRef = useRef<Conv | null>(null);
  const joinedConvRef = useRef<string | null>(null);
  const base = getApiBaseUrl();

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

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
    const t = setInterval(() => void loadConversations(), 60000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    const s = io(base, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = s;
    s.on("message:new", (payload: { conversationId?: string; message?: Msg }) => {
      if (!payload?.conversationId || !payload?.message) return;
      const openId = selectedRef.current?.id;
      if (openId === payload.conversationId) {
        setMessages((prev) => {
          const id = payload.message!.id;
          if (prev.some((m) => m.id === id)) return prev;
          return [...prev, payload.message!];
        });
      }
      void loadConversations();
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
      joinedConvRef.current = null;
    };
  }, [base, loadConversations]);

  useEffect(() => {
    const socket = socketRef.current;
    const convId = selected?.id ?? null;
    if (!socket) return;

    const leavePrevAndJoin = () => {
      const previous = joinedConvRef.current;
      if (previous && previous !== convId) {
        socket.emit("leave", { conversationId: previous });
      }
      joinedConvRef.current = convId;
      if (!convId) return;
      socket.emit(
        "join",
        { conversationId: convId, asAdmin: true },
        (err: Error | null) => {
          if (err) setError(err.message);
        },
      );
    };

    if (socket.connected) leavePrevAndJoin();
    else socket.once("connect", leavePrevAndJoin);

    return () => {
      socket.off("connect", leavePrevAndJoin);
    };
  }, [selected?.id]);

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
      setMessages((prev) =>
        prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data],
      );
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

  const threadMinH =
    "min-h-[min(360px,calc(100dvh-11rem))] sm:min-h-[min(420px,calc(100dvh-12rem))]";

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 lg:flex-row">
      {error && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto max-w-[calc(100vw-2rem)] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:left-auto sm:right-6 sm:mx-0 sm:max-w-sm dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <div
        className={`w-full shrink-0 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 lg:w-72 ${
          selected ? "hidden lg:block lg:max-h-none" : "max-h-[min(40vh,320px)] lg:max-h-none"
        }`}
      >
        <p className="px-2 py-1 text-xs font-medium text-zinc-500">Яриа</p>
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className={`w-full min-h-11 rounded-lg px-3 py-2 text-left text-sm ${
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

      <div
        className={`flex min-w-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${threadMinH} ${
          selected ? "flex" : "hidden lg:flex"
        }`}
      >
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
            Яриа сонгоно уу
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 sm:px-4 dark:border-zinc-800">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label="Жагсаалт руу буцах"
                onClick={() => setSelected(null)}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {selected.displayName || selected.guestId}
              </span>
              <button
                type="button"
                onClick={() => setHumanMode(!selected.humanMode)}
                className="min-h-9 shrink-0 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs leading-tight dark:border-zinc-700 sm:max-w-none"
              >
                {selected.humanMode ? "Бот руу буцаах" : "Ажилтан авах (бот унтраах)"}
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4">
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
            <div className="flex gap-2 border-t border-zinc-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendAgent()}
                placeholder="Хариу бичих…"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => void sendAgent()}
                className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
