import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { ConfirmDialog } from "../components/ui";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const id = useRef(0);

  const push = useCallback((message, type = "info") => {
    const key = ++id.current;
    setToasts((t) => [...t, { key, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 4200);
  }, []);

  const api = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
    // Promise based replacement for window.confirm
    confirm: (opts) => new Promise((resolve) => setConfirmState({ ...opts, resolve })),
  };

  const close = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => {
          const I = Icon[t.type];
          return (
            <div key={t.key} className={`toast ${t.type}`}>
              <I size={18} /> <span>{t.message}</span>
            </div>
          );
        })}
      </div>
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={() => close(true)} onCancel={() => close(false)} />
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
