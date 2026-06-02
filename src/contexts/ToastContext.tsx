/**
 * Lightweight toast notification system. Self-contained, no deps.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "info" | "success" | "warn" | "error";
interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface ToastApi {
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<ToastApi | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastApi["push"]>(
    (t) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-up rounded-xl border bg-white/95 px-4 py-3 shadow-lift backdrop-blur dark:bg-ink-800/95 ${
              t.kind === "success"
                ? "border-success/40"
                : t.kind === "error"
                ? "border-danger/40"
                : t.kind === "warn"
                ? "border-warn/40"
                : "border-ink-200 dark:border-ink-700"
            }`}
          >
            <div className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {t.title}
            </div>
            {t.body && (
              <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-300">
                {t.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
