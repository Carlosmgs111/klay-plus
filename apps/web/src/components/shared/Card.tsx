import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
    card p-6 rounded-2xl
    border border-slate-200 dark:border-slate-800
    bg-white/10 dark:bg-slate-900/10
    backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-blue-800/20
    ${className}
  `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`card-header p-4 text-2xl font-semibold ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`card-body p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardProps) {
  return <div className={`card-footer p-4 ${className}`}>{children}</div>;
}
