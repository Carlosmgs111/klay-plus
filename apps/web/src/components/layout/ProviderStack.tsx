import type { ReactNode } from "react";
import { RuntimeModeProvider } from "../../contexts/RuntimeModeContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";

interface ProviderStackProps {
  children: ReactNode;
}

export function ProviderStack({ children }: ProviderStackProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RuntimeModeProvider>{children}</RuntimeModeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
