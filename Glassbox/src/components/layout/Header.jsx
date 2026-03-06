import { Link } from 'react-router-dom'
import { Menu, Moon, Sun, Search } from 'lucide-react'
import { useState } from 'react'

function Header({ darkMode, setDarkMode }) {
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <header className="glass-card-static sticky top-4 z-50 mx-auto mt-4 px-6 py-4 max-w-[1400px] w-[calc(100%-48px)] rounded-2xl shadow-lg border border-[var(--color-border-glass)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3 no-underline transition-transform hover:scale-105"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--color-accent-primary)]/20">
                        <span className="text-xl text-white">🥂</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] m-0 tracking-tight">
                            GLASSBOX
                        </h1>
                        <p className="text-xs text-[var(--color-accent-primary)] m-0 tracking-widest uppercase font-semibold opacity-80">
                            Forensic Triage
                        </p>
                    </div>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Search (expandable) */}
                    <div
                        className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-10'}`}
                    >
                        {searchOpen ? (
                            <input
                                type="text"
                                placeholder="Search cases..."
                                className="input pr-10"
                                autoFocus
                                onBlur={() => setSearchOpen(false)}
                            />
                        ) : null}
                        <button
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={`btn-ghost btn-icon ${searchOpen ? 'absolute right-1 top-1/2 -translate-y-1/2' : ''}`}
                        >
                            <Search size={18} />
                        </button>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="btn-ghost btn-icon"
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header
