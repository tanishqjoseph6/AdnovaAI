"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type AuthToastType = "success" | "error" | "info";

type AuthToastItem = {
  id: string;
  message: string;
  type: AuthToastType;
};

type AuthToastContextValue = {
  showToast: (message: string, type?: AuthToastType) => void;
};

const AuthToastContext = createContext<AuthToastContextValue | null>(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const TOAST_STYLES: Record<AuthToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/30 bg-red-500/10 text-red-200",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
};

const TOAST_ICON_STYLES: Record<AuthToastType, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-cyan-400",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: AuthToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = TOAST_ICONS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-xl ${TOAST_STYLES[toast.type]}`}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${TOAST_ICON_STYLES[toast.type]}`}
        aria-hidden
      />
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function AuthToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AuthToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: AuthToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { id, message, type }]);

      const timer = setTimeout(() => dismissToast(id), 5000);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AuthToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] flex-col gap-2 sm:bottom-6 sm:right-6 sm:w-auto"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </AuthToastContext.Provider>
  );
}

export function useAuthToast(): AuthToastContextValue {
  const context = useContext(AuthToastContext);
  if (!context) {
    throw new Error("useAuthToast must be used within AuthToastProvider");
  }
  return context;
}
