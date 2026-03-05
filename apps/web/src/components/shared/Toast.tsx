import { useToast } from "../../contexts/ToastContext";
import { Icon } from "./Icon";

const TYPE_ICON: Record<string, string> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
};

const TYPE_COLOR: Record<string, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent",
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
            className={`flex-shrink-0 ${TYPE_COLOR[toast.type]}`}
          />
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-ghost hover:text-primary transition-colors duration-fast"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
