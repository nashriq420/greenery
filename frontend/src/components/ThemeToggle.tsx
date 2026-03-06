"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    // Prevent hydration mismatch by only rendering after mount
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="relative inline-flex items-center justify-center p-2 rounded-md h-9 w-9">
                <span className="sr-only">Toggle theme</span>
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex items-center justify-center p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Toggle theme"
        >
            {theme === "dark" ? (
                <Moon className="h-5 w-5 text-[#D8D8D8]" />
            ) : (
                <Sun className="h-5 w-5 text-gray-700" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
