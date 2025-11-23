"use client"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark")
      setTheme("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    localStorage.setItem("theme", newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-full border border-border bg-[var(--input-background)] hover:bg-accent transition-colors duration-300"
      aria-label="Cambiar tema"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-[var(--foreground)]" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--foreground)]" />
      )}
    </button>
  )
}
