import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          muted: "var(--accent-primary-muted)",
          glow: "var(--accent-primary-glow)",
        },
        success: {
          DEFAULT: "var(--semantic-success)",
          muted: "var(--semantic-success-muted)",
        },
        danger: {
          DEFAULT: "var(--semantic-danger)",
          muted: "var(--semantic-danger-muted)",
        },
        warning: {
          DEFAULT: "var(--semantic-warning)",
          muted: "var(--semantic-warning-muted)",
        },
        info: {
          DEFAULT: "var(--semantic-info)",
          muted: "var(--semantic-info-muted)",
        },
      },
      textSize: {
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      borderRadius: {
        "3xl": "20px",
        "4xl": "24px",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        ghost: "var(--text-ghost)",
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        default: "var(--border-default)",
        strong: "var(--border-strong)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-mono", "JetBrains Mono", "Menlo", "monospace"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "180ms",
        slow: "280ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-down": {
          from: { opacity: "0", maxHeight: "0" },
          to: { opacity: "1", maxHeight: "500px" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "toast-out": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-down": "slide-in-down 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.5s infinite linear",
        "toast-in": "toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "toast-out": "toast-out 0.2s cubic-bezier(0.87, 0, 0.13, 1) forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
