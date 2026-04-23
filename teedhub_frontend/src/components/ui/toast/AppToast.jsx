import React from "react";

export default function AppToast({ toasts, removeToast }) {
  return (
    <div className="app-toast-overlay">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast app-toast-${toast.type}`}
        >
          <div className="app-toast-content">
            <p className="app-toast-message">{toast.message}</p>
          </div>

          <button
            className="app-toast-close"
            onClick={() => removeToast(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}