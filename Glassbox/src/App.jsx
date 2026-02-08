import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/case/:id" element={<CaseDetail />} />
                            <Route path="/case/:id/timeline" element={<Timeline />} />
                            <Route path="/case/:id/contacts" element={<Contacts />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </BrowserRouter>
        </ToastProvider>
    )
}

export default App
