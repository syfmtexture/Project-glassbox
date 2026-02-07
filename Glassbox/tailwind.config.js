/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    bg: "rgba(255, 255, 255, 0.45)",
                    border: "rgba(255, 255, 255, 0.6)",
                    text: "#1C1C1E",
                    textSecondary: "#48484A",
                    textTertiary: "#8E8E93",
                },
                priority: {
                    critical: "#FF3B30",
                    high: "#FF9500",
                    medium: "#34C759",
                    low: "#8E8E93",
                },
                accent: {
                    blue: "#007AFF",
                    purple: "#AF52DE",
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                'liquid-gradient': 'linear-gradient(135deg, #E8F4FD 0%, #FDF4F0 50%, #F0FDF4 100%)',
            },
            boxShadow: {
                'glass-sm': '0 4px 16px rgba(31, 38, 135, 0.05)',
                'glass': '0 8px 32px rgba(31, 38, 135, 0.08)',
                'glass-lg': '0 12px 48px rgba(31, 38, 135, 0.12)',
            },
            backdropBlur: {
                'xs': '2px',
            }
        },
    },
    plugins: [],
}
