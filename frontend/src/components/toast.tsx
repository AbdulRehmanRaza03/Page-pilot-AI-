"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { MessageSquare, Check } from "lucide-react";

type Toast = {
  id: number;
  title: string;
  message: string;
  type: "info" | "success";
};

type ToastContextValue = {
  notify: (title: string, message: string, type?: "info" | "success") => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const notify = useCallback(
    (title: string, message: string, type: "info" | "success" = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      // Auto-dismiss after 4 seconds.
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-card-hover animate-in"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                t.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"
              }`}
            >
              {t.type === "success" ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">{t.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const noopNotify = { notify: () => {} };

export function useToast() {
  const ctx = useContext(ToastContext);
  // Defensive: if no provider, no-op rather than crash.
  if (!ctx) return noopNotify;
  return ctx;
}
