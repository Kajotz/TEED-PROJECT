import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import AppToast from "./AppToast";

const AppToastContext = createContext(null);

export function AppToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const value = useMemo(
    () => ({
      success: (msg) => push(msg, "success"),
      error: (msg) => push(msg, "error"),
      warning: (msg) => push(msg, "warning"),
      info: (msg) => push(msg, "info"),
    }),
    [push]
  );

  return (
    <AppToastContext.Provider value={value}>
      {children}
      <AppToast toasts={toasts} removeToast={removeToast} />
    </AppToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(AppToastContext);

  if (!ctx) {
    throw new Error("useAppToast must be used inside AppToastProvider");
  }

  return ctx;
}