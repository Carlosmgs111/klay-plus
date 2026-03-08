import { Button } from "./Button";
import { Spinner } from "./Spinner";
import type { ButtonHTMLAttributes } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" /> {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
