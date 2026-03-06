import { Link } from 'react-router-dom'
import { Menu, Moon, Sun, Search } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

function Header({ darkMode, setDarkMode }) {
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <header className="glass-card-static sticky top-4 z-50 mx-auto mt-4 px-6 py-4 max-w-[1400px] w-[calc(100%-48px)] rounded-2xl shadow-lg border border-[var(--color-border-glass)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <Link
                    to="/"
                    className="no-underline focus:outline-none"
                >
                    <motion.div
                        className="flex items-center gap-3"
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                    >
                        <motion.div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-accent-primary)]/20 overflow-hidden bg-white/5 backdrop-blur-md border border-[var(--color-border-glass)]"
                            variants={{
                                hidden: { scale: 0, rotate: -90, opacity: 0 },
                                visible: {
                                    scale: 1,
                                    rotate: 0,
                                    opacity: 1,
                                    transition: { type: "spring", stiffness: 300, damping: 20 }
                                },
                                hover: {
                                    scale: 1.15,
                                    rotate: 15,
                                    transition: { type: "spring", stiffness: 400, damping: 10 }
                                }
                            }}
                        >
                            <img src="/logo.png" alt="Glassbox Logo" className="w-8 h-8 object-contain" />
                        </motion.div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: {
                                    opacity: 1,
                                    x: 0,
                                    transition: { delay: 0.15, duration: 0.5, ease: "easeOut" }
                                },
                                hover: {
                                    x: 5,
                                    transition: { type: "spring", stiffness: 400, damping: 10 }
                                }
                            }}
                        >
                            <motion.h1
                                className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-text-secondary)] m-0 tracking-tight"
                                variants={{
                                    hover: { scale: 1.05, originX: 0 }
                                }}
                            >
                                GLASSBOX
                            </motion.h1>
                            <p className="text-xs text-[var(--color-accent-primary)] m-0 tracking-widest uppercase font-semibold opacity-80">
                                Forensic Triage
                            </p>
                        </motion.div>
                    </motion.div>
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
