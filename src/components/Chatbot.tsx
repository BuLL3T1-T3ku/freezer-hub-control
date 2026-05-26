import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const loading = status === "submitted" || status === "streaming";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/30"
          aria-label="Abrir assistente"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <div>
                <div className="text-sm font-semibold leading-none">Assistente de Alertas</div>
                <div className="mt-0.5 text-[10px] opacity-80">Tire dúvidas sobre incidentes</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                Pergunte coisas como: <em>"Por que um freezer pode estar a -10°C?"</em> ou
                <em> "Quais são os passos para diagnosticar perda de gás?"</em>
              </div>
            )}
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={isUser ? "flex justify-end" : ""}>
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground"
                        : "max-w-[90%] whitespace-pre-wrap text-foreground"
                    }
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="text-xs text-muted-foreground">Pensando…</div>
            )}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre um alerta…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
