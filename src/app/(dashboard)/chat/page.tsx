"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, ChevronLeft, MessageSquare, Plus, Trash2 } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import {
  ensureClientAuthorized,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, getSocketBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

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
  agentDisplayName?: string;
  agentUsername?: string;
};

type ChatChoiceNode = {
  id: string;
  label: string;
  answer: string;
  choices: ChatChoiceNode[];
};

type ChatbotConfig = {
  startButtonLabel: string;
  welcomeMessage: string;
  /** Free-text replies when no chip matches (stored in DB; backend has no hardcoded bot copy). */
  fallbackBotReply: string;
  restartLabel: string;
  rootChoices: ChatChoiceNode[];
};

const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  startButtonLabel: "Чат эхлүүлэх",
  welcomeMessage: "Сайн байна уу! Доорх сонголтоос нэгийг сонгоно уу.",
  fallbackBotReply: "",
  restartLabel: "Эхлэл рүү буцах",
  rootChoices: [],
};

function newChoiceNode(): ChatChoiceNode {
  return {
    id: `choice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    answer: "",
    choices: [],
  };
}

function normalizeChoiceNode(raw: unknown, depth = 0): ChatChoiceNode | null {
  if (!raw || typeof raw !== "object" || depth > 8) return null;
  const r = raw as Record<string, unknown>;
  const label = String(r.label ?? "").trim();
  if (!label) return null;
  const id = String(r.id ?? "").trim() || `choice-${depth}-${label}`;
  const answer = String(r.answer ?? "").trim() || label;
  const childrenRaw = Array.isArray(r.choices) ? r.choices : [];
  return {
    id,
    label,
    answer,
    choices: childrenRaw
      .map((c) => normalizeChoiceNode(c, depth + 1))
      .filter((c): c is ChatChoiceNode => Boolean(c)),
  };
}

function normalizeChatbotConfig(sections: unknown): ChatbotConfig {
  if (!sections || typeof sections !== "object") return DEFAULT_CHATBOT_CONFIG;
  const r = sections as Record<string, unknown>;
  const rootChoicesRaw = Array.isArray(r.rootChoices) ? r.rootChoices : [];
  return {
    startButtonLabel:
      String(r.startButtonLabel ?? "").trim() ||
      DEFAULT_CHATBOT_CONFIG.startButtonLabel,
    welcomeMessage:
      String(r.welcomeMessage ?? "").trim() || DEFAULT_CHATBOT_CONFIG.welcomeMessage,
    fallbackBotReply: String(r.fallbackBotReply ?? "").trim(),
    restartLabel:
      String(r.restartLabel ?? "").trim() || DEFAULT_CHATBOT_CONFIG.restartLabel,
    rootChoices: rootChoicesRaw
      .map((n) => normalizeChoiceNode(n))
      .filter((n): n is ChatChoiceNode => Boolean(n)),
  };
}

function updateNodeAtPath(
  nodes: ChatChoiceNode[],
  path: number[],
  updater: (node: ChatChoiceNode) => ChatChoiceNode,
): ChatChoiceNode[] {
  if (path.length === 0) return nodes;
  const [head, ...rest] = path;
  return nodes.map((node, idx) => {
    if (idx !== head) return node;
    if (rest.length === 0) return updater(node);
    return {
      ...node,
      choices: updateNodeAtPath(node.choices, rest, updater),
    };
  });
}

function removeNodeAtPath(nodes: ChatChoiceNode[], path: number[]): ChatChoiceNode[] {
  if (path.length === 0) return nodes;
  const [head, ...rest] = path;
  if (rest.length === 0) return nodes.filter((_, i) => i !== head);
  return nodes.map((node, idx) => {
    if (idx !== head) return node;
    return { ...node, choices: removeNodeAtPath(node.choices, rest) };
  });
}

function ChatChoiceEditor({
  nodes,
  path = [],
  onChangeLabel,
  onChangeAnswer,
  onAddChild,
  onRemove,
}: {
  nodes: ChatChoiceNode[];
  path?: number[];
  onChangeLabel: (path: number[], value: string) => void;
  onChangeAnswer: (path: number[], value: string) => void;
  onAddChild: (path: number[]) => void;
  onRemove: (path: number[]) => void;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="space-y-3">
      {nodes.map((node, idx) => {
        const nodePath = [...path, idx];
        return (
          <div
            key={node.id}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="space-y-2">
                <input
                  value={node.label}
                  onChange={(e) => onChangeLabel(nodePath, e.target.value)}
                  placeholder={t.chat.chatbot.actions.placeholderLabel}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
                <textarea
                  value={node.answer}
                  onChange={(e) => onChangeAnswer(nodePath, e.target.value)}
                  rows={2}
                  placeholder={t.chat.chatbot.actions.placeholderAnswer}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onAddChild(nodePath)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-2 text-xs dark:border-zinc-600"
                >
                  <Plus className="h-3.5 w-3.5" /> {t.chat.chatbot.actions.addChild}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(nodePath)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-2 text-xs text-rose-700 dark:border-rose-800 dark:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t.siteContent.common.remove}
                </button>
              </div>
            </div>
            {node.choices.length > 0 && (
              <div className="mt-3 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                <ChatChoiceEditor
                  nodes={node.choices}
                  path={nodePath}
                  onChangeLabel={onChangeLabel}
                  onChangeAnswer={onChangeAnswer}
                  onAddChild={onAddChild}
                  onRemove={onRemove}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ChatTab = "chats" | "chatbot";

export default function ChatAdminPage() {
  const { t } = useAdminLanguage();
  const [tab, setTab] = useState<ChatTab>("chats");
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
    startButtonLabel: t.chat.chatbot.fields.startButton,
    welcomeMessage: t.chat.chatbot.fields.welcomeMessage,
    fallbackBotReply: "",
    restartLabel: t.chat.chatbot.fields.restartButton,
    rootChoices: [],
  };

  const [botConfig, setBotConfig] = useState<ChatbotConfig>(DEFAULT_CHATBOT_CONFIG);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedRef = useRef<Conv | null>(null);
  const joinedConvRef = useRef<string | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/conversations"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Conv[] };
      setConversations(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    }
  }, [t]);

  const loadMessages = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/conversations/${id}/messages`),
          withClientAdminAuth(),
        );
        const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { data: Msg[] };
        setMessages(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.siteContent.common.error);
      }
    },
    [t],
  );

  const loadBotConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/site-pages/chatbot"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data?: { sections?: unknown } };
      setBotConfig(normalizeChatbotConfig(json.data?.sections));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    } finally {
      setConfigLoading(false);
    }
  }, [t, normalizeChatbotConfig]);

  useEffect(() => {
    void loadConversations();
    const t = setInterval(() => void loadConversations(), 60000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (tab === "chatbot") void loadBotConfig();
  }, [tab, loadBotConfig]);

  useEffect(() => {
    const s = io(getSocketBaseUrl(), {
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
  }, [loadConversations]);

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
      const res = await fetch(
        joinBackendRequestUrl(
          getApiBaseUrl(),
          `/api/v1/admin/conversations/${selected.id}/messages`,
        ),
        withClientAdminAuth({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input.trim() }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Msg };
      setMessages((prev) =>
        prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data],
      );
      setInput("");
      void loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    }
  }

  async function setHumanMode(humanMode: boolean) {
    if (!selected) return;
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/conversations/${selected.id}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ humanMode }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { data: Conv };
      setSelected(json.data);
      void loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    }
  }

  async function saveBotConfig() {
    setConfigSaving(true);
    setConfigMsg(null);
    setError(null);
    try {
      const cleaned = {
        ...botConfig,
        rootChoices: botConfig.rootChoices
          .map((n) => normalizeChoiceNode(n))
          .filter((n): n is ChatChoiceNode => Boolean(n)),
      };
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/site-pages/chatbot"),
        withClientAdminAuth({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: cleaned }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());
      setConfigMsg(t.chat.chatbot.status.success);
      setTimeout(() => setConfigMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    } finally {
      setConfigSaving(false);
    }
  }

  function changeNodeLabel(path: number[], value: string) {
    setBotConfig((prev) => ({
      ...prev,
      rootChoices: updateNodeAtPath(prev.rootChoices, path, (node) => ({
        ...node,
        label: value,
      })),
    }));
  }

  function changeNodeAnswer(path: number[], value: string) {
    setBotConfig((prev) => ({
      ...prev,
      rootChoices: updateNodeAtPath(prev.rootChoices, path, (node) => ({
        ...node,
        answer: value,
      })),
    }));
  }

  function addNode(path: number[]) {
    if (path.length === 0) {
      setBotConfig((prev) => ({
        ...prev,
        rootChoices: [...prev.rootChoices, newChoiceNode()],
      }));
      return;
    }
    setBotConfig((prev) => ({
      ...prev,
      rootChoices: updateNodeAtPath(prev.rootChoices, path, (node) => ({
        ...node,
        choices: [...node.choices, newChoiceNode()],
      })),
    }));
  }

  function removeNode(path: number[]) {
    setBotConfig((prev) => ({
      ...prev,
      rootChoices: removeNodeAtPath(prev.rootChoices, path),
    }));
  }

  /** Mobile: keep thread usable; desktop: height comes from chats shell (no page scroll). */
  const threadMinHMobile =
    "max-lg:min-h-[min(380px,calc(100dvh-12rem))]";

  /** Shared viewport cap (tab bar + app chrome); inner panels scroll. */
  const tabPanelViewport =
    "w-full min-h-0 max-h-[calc(100dvh-9rem)] overflow-hidden lg:h-[min(36rem,calc(100dvh-11rem))] lg:max-h-[calc(100dvh-11rem)]";

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl min-w-0 flex-col gap-4">
      <div
        className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/50"
        role="tablist"
        aria-label={t.chat.title}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chats"}
          onClick={() => setTab("chats")}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none sm:min-w-40 ${
            tab === "chats"
              ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-950 dark:text-emerald-100"
              : "text-zinc-600 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
          }`}
        >
          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
          {t.chat.tabs.chats}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chatbot"}
          onClick={() => setTab("chatbot")}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none sm:min-w-40 ${
            tab === "chatbot"
              ? "bg-white text-emerald-800 shadow-sm dark:bg-zinc-950 dark:text-emerald-100"
              : "text-zinc-600 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
          }`}
        >
          <Bot className="h-4 w-4 shrink-0" aria-hidden />
          {t.chat.tabs.chatbot}
        </button>
      </div>

      {tab === "chatbot" && (
        <section
          className={`flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${tabPanelViewport}`}
        >
          <div className="shrink-0 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {t.chat.chatbot.title}
                </h2>
                <p className="text-xs text-zinc-500">
                  {t.chat.chatbot.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void saveBotConfig()}
                disabled={configSaving || configLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {configSaving ? t.chat.chatbot.status.saving : t.common.save}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={botConfig.startButtonLabel}
                onChange={(e) =>
                  setBotConfig((prev) => ({ ...prev, startButtonLabel: e.target.value }))
                }
                placeholder={t.chat.chatbot.fields.startButton}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                value={botConfig.restartLabel}
                onChange={(e) =>
                  setBotConfig((prev) => ({ ...prev, restartLabel: e.target.value }))
                }
                placeholder={t.chat.chatbot.fields.restartButton}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => addNode([])}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              >
                <Plus className="h-4 w-4" /> {t.chat.chatbot.actions.addRoot}
              </button>
            </div>

            <textarea
              value={botConfig.welcomeMessage}
              onChange={(e) =>
                setBotConfig((prev) => ({ ...prev, welcomeMessage: e.target.value }))
              }
              rows={2}
              placeholder={t.chat.chatbot.fields.welcomeMessage}
              className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />

            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t.chat.chatbot.fields.fallbackReply}
              </span>
              <textarea
                value={botConfig.fallbackBotReply}
                onChange={(e) =>
                  setBotConfig((prev) => ({ ...prev, fallbackBotReply: e.target.value }))
                }
                rows={3}
                placeholder={t.chat.chatbot.fields.fallbackHint}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <div className="mt-4">
              {configLoading ? (
                <p className="text-sm text-zinc-500">{t.chat.chatbot.status.loading}</p>
              ) : (
                <>
                  {botConfig.rootChoices.length === 0 && (
                    <p className="mb-3 text-sm text-zinc-500">
                      {t.chat.chatbot.actions.emptyChoices}
                    </p>
                  )}
                  <ChatChoiceEditor
                    nodes={botConfig.rootChoices}
                    onChangeLabel={changeNodeLabel}
                    onChangeAnswer={changeNodeAnswer}
                    onAddChild={addNode}
                    onRemove={removeNode}
                  />
                </>
              )}
            </div>
            {configMsg && <p className="mt-3 text-sm text-emerald-700">{configMsg}</p>}
          </div>
        </section>
      )}

      {tab === "chats" && (
      <div className={`flex min-w-0 flex-col gap-4 lg:flex-row ${tabPanelViewport}`}>
      {error && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto max-w-[calc(100vw-2rem)] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:left-auto sm:right-6 sm:mx-0 sm:max-w-sm dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <div
        className={`w-full shrink-0 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 lg:h-full lg:min-h-0 lg:w-72 lg:max-h-full ${
          selected ? "hidden lg:block" : "max-h-[min(40vh,320px)]"
        }`}
      >
        <p className="px-2 py-1 text-xs font-medium text-zinc-500">{t.chat.sidebar.listTitle}</p>
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
               {c.displayName || (t.chat.thread.roles.user + " " + c.guestId.slice(0, 8))}
            </div>
            <div className="text-xs text-zinc-500">
              {c.humanMode ? t.chat.thread.roles.agent("") : t.chat.thread.roles.bot} · {c.status}
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="px-2 text-sm text-zinc-500">{t.chat.sidebar.empty}</p>
        )}
      </div>

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:h-full lg:min-h-0 ${threadMinHMobile} ${
          selected ? "flex" : "hidden lg:flex"
        }`}
      >
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
            {t.chat.sidebar.selectPrompt}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 sm:px-4 dark:border-zinc-800">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
                aria-label={t.chat.thread.backToList}
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
                {selected.humanMode ? t.chat.thread.backToBot : t.chat.thread.connectHuman}
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
                      {m.role === "agent" && (m.agentDisplayName || m.agentUsername)
                        ? t.chat.thread.roles.agent(m.agentDisplayName || m.agentUsername || "")
                        : m.role === "user"
                          ? t.chat.thread.roles.user
                          : t.chat.thread.roles.bot}
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
                placeholder={t.chat.thread.inputPlaceholder}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => void sendAgent()}
                className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t.chat.thread.send}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
      )}
    </div>
  );
}
