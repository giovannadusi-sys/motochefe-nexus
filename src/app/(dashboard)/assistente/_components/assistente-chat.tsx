"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MensagemInicial {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
}

/**
 * Chat do Assistente IA. Streaming via `useChat` (Vercel AI SDK) — o
 * texto aparece incrementalmente, não tudo de uma vez no final
 * (feedback de progresso real, não só um spinner). `mensagensIniciais`
 * vem do histórico salvo no Supabase (route.ts persiste cada pergunta
 * e resposta) — reabrir a página não começa do zero.
 */
export function AssistenteChat({ mensagensIniciais }: { mensagensIniciais: MensagemInicial[] }) {
  const [input, setInput] = React.useState("");
  const { messages, sendMessage, status, error } = useChat({
    messages: mensagensIniciais,
    transport: new DefaultChatTransport({ api: "/api/assistente/chat" }),
  });

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  const carregando = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col rounded-xl bg-surface shadow-[var(--shadow-card)]">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Sparkles className="size-6" aria-hidden="true" />
            <p className="text-sm">
              Pergunte sobre produtos, especificações, processos ou argumentação comercial.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "flex max-w-[80%] items-start gap-2"
                  : "flex max-w-[80%] items-start gap-2"
              }
            >
              {message.role === "assistant" && (
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </div>
              )}
              <div
                className={
                  message.role === "user"
                    ? "rounded-xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "prose prose-sm dark:prose-invert max-w-none rounded-xl rounded-tl-sm bg-muted px-3.5 py-2 text-foreground prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0"
                }
              >
                {message.role === "user"
                  ? message.parts.map((part, i) =>
                      part.type === "text" ? <span key={i}>{part.text}</span> : null
                    )
                  : message.parts.map((part, i) =>
                      part.type === "text" ? <Markdown key={i}>{part.text}</Markdown> : null
                    )}
              </div>
              {message.role === "user" && (
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-3.5" aria-hidden="true" />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {status === "submitted" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </div>
              <span className="flex gap-0.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-1 rounded-lg bg-danger-bg p-3 text-xs text-danger"
            >
              <span className="font-medium">Não foi possível obter uma resposta:</span>
              <code className="rounded bg-surface px-1.5 py-1 text-[11px]">
                {error.message}
              </code>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[var(--border-soft)] p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte alguma coisa..."
          disabled={carregando}
        />
        <Button type="submit" isLoading={carregando} disabled={!input.trim()}>
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
