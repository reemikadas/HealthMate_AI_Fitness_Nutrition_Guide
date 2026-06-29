import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  Apple,
  ArrowUp,
  BookOpen,
  ChevronDown,
  Dumbbell,
  HeartPulse,
  Menu,
  MessageSquareText,
  MoonStar,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askHealthMate } from "./api";
import type { Chat, Message } from "./types";

const STORAGE_KEY = "healthmate-chats-v2";
const starterPrompts = [
  { icon: Dumbbell, label: "Build a beginner workout", prompt: "Create a beginner-friendly full-body workout plan for three days a week." },
  { icon: Apple, label: "Plan high-protein meals", prompt: "Suggest a simple high-protein meal plan for muscle gain." },
  { icon: MoonStar, label: "Improve my recovery", prompt: "How should I recover after an intense workout?" },
];

const newChat = (): Chat => ({
  id: crypto.randomUUID(),
  title: "New conversation",
  createdAt: Date.now(),
  messages: [],
});

function loadChats(): Chat[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [newChat()];
  } catch {
    return [newChat()];
  }
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeChat = chats.find((chat) => chat.id === activeId) ?? chats[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  const updateActive = (updater: (chat: Chat) => Chat) => {
    setChats((current) => current.map((chat) => (chat.id === activeId ? updater(chat) : chat)));
  };

  const createChat = () => {
    const chat = newChat();
    setChats((current) => [chat, ...current]);
    setActiveId(chat.id);
    setSidebarOpen(false);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const deleteChat = (id: string) => {
    if (loading && id === activeId) abortRef.current?.abort();
    setChats((current) => {
      const remaining = current.filter((chat) => chat.id !== id);
      const next = remaining.length ? remaining : [newChat()];
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const submit = async (raw: string) => {
    const message = raw.trim();
    if (!message || loading || !activeChat) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: message };
    const history = activeChat.messages;
    updateActive((chat) => ({
      ...chat,
      title: chat.messages.length === 0 ? `${message.slice(0, 42)}${message.length > 42 ? "…" : ""}` : chat.title,
      messages: [...chat.messages, userMessage],
    }));
    setInput("");
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const result = await askHealthMate(message, history, abortRef.current.signal);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };
      updateActive((chat) => ({ ...chat, messages: [...chat.messages, assistantMessage] }));
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        updateActive((chat) => ({
          ...chat,
          messages: [
            ...chat.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
              error: true,
            },
          ],
        }));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(input);
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><HeartPulse size={22} strokeWidth={2.4} /></div>
          <div><strong>HealthMate</strong><span>Move well. Live well.</span></div>
          <button className="icon-button close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <button className="new-chat" onClick={createChat}><Plus size={18} /> New conversation</button>

        <div className="history-label"><MessageSquareText size={14} /> Your conversations</div>
        <nav className="chat-list" aria-label="Chat history">
          {chats.map((chat) => (
            <div className={`chat-row ${chat.id === activeId ? "active" : ""}`} key={chat.id}>
              <button className="chat-select" onClick={() => { setActiveId(chat.id); setSidebarOpen(false); }}>
                <span>{chat.title}</span>
                <small>{new Date(chat.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</small>
              </button>
              <button className="delete-chat" onClick={() => deleteChat(chat.id)} aria-label={`Delete ${chat.title}`}><Trash2 size={15} /></button>
            </div>
          ))}
        </nav>

        <div className="sidebar-note">
          <BookOpen size={17} />
          <p><strong>Evidence-informed</strong><span>Answers are grounded in a curated fitness and nutrition library.</span></p>
        </div>
      </aside>
      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="mobile-brand"><HeartPulse size={20} /><strong>HealthMate</strong></div>
          <span className="status"><i /> Knowledge base online</span>
        </header>

        <section className={`conversation ${activeChat.messages.length === 0 ? "empty" : ""}`}>
          {activeChat.messages.length === 0 ? (
            <div className="welcome">
              <div className="eyebrow"><Sparkles size={15} /> Your everyday wellness coach</div>
              <h1>Stronger choices start<br />with a good question.</h1>
              <p className="lede">Get practical guidance for training, nutrition, and recovery—grounded in trusted resources, shaped around you.</p>
              <div className="prompt-grid">
                {starterPrompts.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} className="prompt-card" onClick={() => void submit(prompt)}>
                    <span className="prompt-icon"><Icon size={21} /></span>
                    <span>{label}</span>
                    <ArrowUp size={17} className="prompt-arrow" />
                  </button>
                ))}
              </div>
              <div className="trust-line"><span>Fitness</span><i /><span>Nutrition</span><i /><span>Recovery</span></div>
            </div>
          ) : (
            <div className="messages">
              {activeChat.messages.map((message) => (
                <article className={`message ${message.role} ${message.error ? "error" : ""}`} key={message.id}>
                  {message.role === "assistant" && <div className="assistant-mark"><HeartPulse size={17} /></div>}
                  <div className="message-body">
                    <div className="message-content"><ReactMarkdown>{message.content}</ReactMarkdown></div>
                    {!!message.sources?.length && (
                      <div className="sources">
                        <button onClick={() => setSourcesOpen((open) => ({ ...open, [message.id]: !open[message.id] }))}>
                          <BookOpen size={15} /> {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
                          <ChevronDown size={15} className={sourcesOpen[message.id] ? "rotated" : ""} />
                        </button>
                        {sourcesOpen[message.id] && <ul>{message.sources.map((source) => <li key={source}>{source}</li>)}</ul>}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {loading && (
                <article className="message assistant">
                  <div className="assistant-mark"><HeartPulse size={17} /></div>
                  <div className="thinking"><span /><span /><span /></div>
                </article>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <div className="composer-wrap">
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about workouts, nutrition, or recovery…"
              rows={1}
              maxLength={2000}
              aria-label="Message HealthMate"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={20} /></button>
          </form>
          <p className="disclaimer">HealthMate provides general information, not medical advice. Consult a qualified professional for personal care.</p>
        </div>
      </main>
    </div>
  );
}
