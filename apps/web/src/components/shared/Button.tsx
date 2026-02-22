import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

const VARIANT_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
};

const SIZE_CLASS = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
