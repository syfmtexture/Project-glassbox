import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, Search } from 'lucide-react'
import { useState } from 'react'

function Header({ darkMode, setDarkMode }) {
    const location = useLocation()
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <header className="glass-card-static sticky top-0 z-50 mx-4 mt-4 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <span className="text-2xl">🥂</span>
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] m-0">
                            GLASSBOX
                        </h1>
                        <p className="text-xs text-[var(--color-text-secondary)] m-0 tracking-widest uppercase">
                            Forensic Triage
                        </p>
                    </div>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Search (expandable) */}
                    <div className={`relative transition-all duration-300 ${searchOpen ? 'w-64' : 'w-10'}`}>
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
