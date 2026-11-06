import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ToastState {
  id: number;
  message: string;
  undo?: () => void | Promise<void>;
}

const Ctx = createContext<(message: string, undo?: ToastState['undo']) => void>(() => {});

/** Show a short message, optionally with an Undo button. Newer toasts replace older ones. */
export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number>();
  const seq = useRef(0);

  const show = useCallback((message: string, undo?: ToastState['undo']) => {
    setToast({ id: ++seq.current, message, undo });
  }, []);

  useEffect(() => {
    if (!toast) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), toast.undo ? 5000 : 2200);
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          <span className="truncate">{toast.message}</span>
          {toast.undo && (
            <button
              className="shrink-0 font-bold text-teal-300 dark:text-teal-700"
              onClick={async () => {
                const undo = toast.undo!;
                setToast(null);
                await undo();
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
