import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
    p-6 rounded-3xl
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
  return (
    <div className={`p-4 text-4xl font-semibold ${className}`}>{children}</div>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
