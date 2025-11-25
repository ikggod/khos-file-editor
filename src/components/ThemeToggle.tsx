'use client'

import { useState, useEffect } from 'react'
import { Icons } from './Icons'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Icons.sun className="w-5 h-5 text-amber-500" />
      ) : (
        <Icons.moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  )
}
