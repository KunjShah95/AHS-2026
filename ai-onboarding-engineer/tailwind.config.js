/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        { pattern: /^(flex|inline-flex|items-|justify-|gap-|px-|py-|rounded-|w-|max-w-|min-w-|min-h-|border|bg-|text-|transition-|duration-|hover:|focus:|focus-visible:|animate-|opacity-|pointer-events-|cursor-|drop-shadow-|ring-|ring-offset-)/ },
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
            },
            spacing: {
                gutter: 'clamp(1rem, 2vw, 2rem)',
                'section-sm': 'clamp(2rem, 4vw, 4rem)',
                'section-md': 'clamp(3rem, 6vw, 6rem)',
                'section-lg': 'clamp(4rem, 8vw, 8rem)',
            },
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: "hsl(var(--card))",
                "card-foreground": "hsl(var(--card-foreground))",
                popover: "hsl(var(--popover))",
                "popover-foreground": "hsl(var(--popover-foreground))",
                primary: "hsl(var(--primary))",
                "primary-foreground": "hsl(var(--primary-foreground))",
                secondary: "hsl(var(--secondary))",
                "secondary-foreground": "hsl(var(--secondary-foreground))",
                muted: "hsl(var(--muted))",
                "muted-foreground": "hsl(var(--muted-foreground))",
                accent: "hsl(var(--accent))",
                "accent-foreground": "hsl(var(--accent-foreground))",
                destructive: "hsl(var(--destructive))",
                "destructive-foreground": "hsl(var(--destructive-foreground))",
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))"
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
            },
            boxShadow: {
                'terminal': '0 0 8px rgba(0, 255, 65, 0.3), inset 0 0 6px rgba(0, 255, 65, 0.1)',
                'terminal-lg': '0 0 16px rgba(0, 255, 65, 0.4), inset 0 0 8px rgba(0, 255, 65, 0.15)',
                'card-light': '0 1px 3px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 255, 65, 0.08)',
                'card-elevated': '0 4px 12px rgba(0, 255, 65, 0.12), 0 8px 24px rgba(0, 0, 0, 0.4)',
            },
            fontSize: {
                'display-sm': ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
                'display-md': ['3.5rem', { lineHeight: '1.05', fontWeight: '700' }],
                'display-lg': ['4.5rem', { lineHeight: '1', fontWeight: '700' }],
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "scanline": "scanline 2.5s ease-in-out",
                "blink": "blink 1.2s step-end infinite",
                "terminal-glow": "terminal-glow 2s ease-in-out infinite",
                "fade-in": "fade-in 0.5s ease-out",
                "slide-up": "slide-up 0.5s ease-out",
                "slide-down": "slide-down 0.5s ease-out",
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "shimmer": "shimmer 2s ease-in-out infinite",
                "typewriter": "typewriter 3.5s steps(40, end)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "scanline": {
                    "0%": { transform: "translateY(-100%)", opacity: "0.3" },
                    "50%": { opacity: "0.5" },
                    "100%": { transform: "translateY(100vh)", opacity: "0.3" },
                },
                "blink": {
                    "0%, 50%": { opacity: "1" },
                    "51%, 100%": { opacity: "0" },
                },
                "terminal-glow": {
                    "0%, 100%": {
                        boxShadow: "0 0 5px rgba(0, 255, 65, 0.5), 0 0 10px rgba(0, 255, 65, 0.3)"
                    },
                    "50%": {
                        boxShadow: "0 0 10px rgba(0, 255, 65, 0.8), 0 0 20px rgba(0, 255, 65, 0.5)"
                    },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    "0%": { opacity: "0", transform: "translateY(-10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "1", boxShadow: "0 0 8px rgba(0, 255, 65, 0.3)" },
                    "50%": { opacity: "0.8", boxShadow: "0 0 16px rgba(0, 255, 65, 0.6)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                "typewriter": {
                    "from": { width: "0" },
                    "to": { width: "100%" },
                },
            },
        },
    },
    plugins: [],
}
