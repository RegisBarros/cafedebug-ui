import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        primary: "var(--color-primary)",
        "primary-strong": "var(--color-primary-strong)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        tertiary: "var(--color-tertiary)",
        "tertiary-container": "var(--color-tertiary-container)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        "outline-variant": "var(--color-outline-variant)",
        "focus-ring": "var(--color-focus-ring)"
      },
      spacing: {
        1: "var(--space-1)",
        1.5: "var(--space-1-5)",
        2: "var(--space-2)",
        2.5: "var(--space-2-5)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        14: "var(--space-14)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)"
      },
      boxShadow: {
        ambient: "var(--shadow-ambient)",
        float: "var(--shadow-float)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      }
    }
  }
};

export default config;
