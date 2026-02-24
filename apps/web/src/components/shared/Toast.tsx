import { useToast } from "../../contexts/ToastContext.js";
import { Icon } from "./Icon.js";

const TYPE_ICON: Record<string, string> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
};

const TYPE_STYLE: Record<string, string> = {
  success: "var(--semantic-success)",
  error: "var(--semantic-danger)",
  info: "var(--accent-primary)",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} flex items-center gap-3 ${
            toast.exiting ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <Icon
            name={TYPE_ICON[toast.type]}
            size={18}
            className="flex-shrink-0"
            style={{ color: TYPE_STYLE[toast.type] }}
          />
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0"
            style={{ color: "var(--text-ghost)", transition: "color 150ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-ghost)"; }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
