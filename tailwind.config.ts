import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* Apple System Colors */
      colors: {
        // Semantic Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Apple System Colors
        system: {
          blue: "hsl(var(--system-blue))",
          green: "hsl(var(--system-green))",
          indigo: "hsl(var(--system-indigo))",
          orange: "hsl(var(--system-orange))",
          pink: "hsl(var(--system-pink))",
          purple: "hsl(var(--system-purple))",
          red: "hsl(var(--system-red))",
          teal: "hsl(var(--system-teal))",
          yellow: "hsl(var(--system-yellow))",
          gray: "hsl(var(--system-gray))",
          gray2: "hsl(var(--system-gray2))",
          gray3: "hsl(var(--system-gray3))",
          gray4: "hsl(var(--system-gray4))",
          gray5: "hsl(var(--system-gray5))",
          gray6: "hsl(var(--system-gray6))",
        },
        // Sidebar Colors
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      /* Apple Spacing Scale */
      spacing: {
        "0": "var(--space-0)",
        "1": "var(--space-1)",
        "2": "var(--space-2)",
        "3": "var(--space-3)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
        "8": "var(--space-8)",
        "10": "var(--space-10)",
        "12": "var(--space-12)",
        "16": "var(--space-16)",
        "20": "var(--space-20)",
        "24": "var(--space-24)",
      },
      /* Apple Border Radius */
      borderRadius: {
        "none": "var(--radius-none)",
        "xs": "var(--radius-xs)",
        "sm": "var(--radius-sm)", 
        "md": "var(--radius-md)",
        "lg": "var(--radius-lg)",
        "xl": "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        "full": "var(--radius-full)",
        // Legacy support
        "DEFAULT": "var(--radius)",
      },
      /* Apple Elevation Shadows */
      boxShadow: {
        "xs": "var(--shadow-xs)",
        "sm": "var(--shadow-sm)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
        "xl": "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      /* Apple Typography Scale */
      fontSize: {
        "large-title": ["34px", { lineHeight: "41px", fontWeight: "700" }],
        "title-1": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "title-2": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "title-3": ["20px", { lineHeight: "25px", fontWeight: "600" }],
        "headline": ["17px", { lineHeight: "22px", fontWeight: "600" }],
        "body": ["17px", { lineHeight: "22px", fontWeight: "400" }],
        "callout": ["16px", { lineHeight: "21px", fontWeight: "400" }],
        "subheadline": ["15px", { lineHeight: "20px", fontWeight: "400" }],
        "footnote": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "caption-1": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "caption-2": ["11px", { lineHeight: "13px", fontWeight: "400" }],
      },
      /* Apple Animations */
      keyframes: {
        // Apple-style spring animations
        "spring-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.02)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "spring-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.98)", opacity: "0.8" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // Legacy animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "spring-in": "spring-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "spring-out": "spring-out 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19)",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        // Legacy animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      /* Apple Transition Timing */
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('tailwind-scrollbar-hide')],
};

export default config;
