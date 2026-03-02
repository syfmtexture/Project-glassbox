import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import CaseDetail from './pages/CaseDetail'
import Timeline from './pages/Timeline'
import Contacts from './pages/Contacts'
import { ToastProvider } from './components/ui/Toast'

function App() {
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkMode(prefersDark)
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    }, [darkMode])

    return (
        <ToastProvider>
            <BrowserRouter>
                <div className="app">
                    <Header darkMode={darkMode} setDarkMode={setDarkMode} />
                    <main className="main-content">
                        <AnimatePresence mode="wait">
                            <Routes>
                                <Route path="/" element={<motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><Dashboard /></motion.div>} />
                                <Route path="/case/:id" element={<motion.div key="case" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><CaseDetail /></motion.div>} />
                                <Route path="/case/:id/timeline" element={<motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><Timeline /></motion.div>} />
                                <Route path="/case/:id/contacts" element={<motion.div key="contacts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><Contacts /></motion.div>} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </AnimatePresence>
                    </main>
                </div>
            </BrowserRouter>
        </ToastProvider>
    )
}

export default App
