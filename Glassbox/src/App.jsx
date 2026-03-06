import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import { ToastProvider } from './components/ui/Toast'

// Lazy loaded pages for code splitting
const CaseDetail = lazy(() => import('./pages/CaseDetail'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Contacts = lazy(() => import('./pages/Contacts'))

const queryClient = new QueryClient()

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-primary)] p-4">
            <div className="max-w-md w-full p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-[var(--color-accent-critical)] mb-4">
                    Something went wrong
                </h2>
                <pre className="text-sm text-[var(--color-text-secondary)] mb-4 overflow-auto">
                    {error.message}
                </pre>
                <button
                    onClick={resetErrorBoundary}
                    className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded font-medium hover:opacity-90"
                >
                    Try again
                </button>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Dashboard />
                        </motion.div>
                    }
                />
                <Route
                    path="/case/:id"
                    element={
                        <motion.div
                            key="case"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <CaseDetail />
                        </motion.div>
                    }
                />
                <Route
                    path="/case/:id/timeline"
                    element={
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Timeline />
                        </motion.div>
                    }
                />
                <Route
                    path="/case/:id/contacts"
                    element={
                        <motion.div
                            key="contacts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Contacts />
                        </motion.div>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    )
}

function App() {
    const [darkMode, setDarkMode] = useState(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    }, [darkMode])

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <BrowserRouter>
                        <div className="app">
                            <Header darkMode={darkMode} setDarkMode={setDarkMode} />
                            <main className="main-content">
                                <Suspense fallback={<LoadingFallback />}>
                                    <AnimatedRoutes />
                                </Suspense>
                            </main>
                        </div>
                    </BrowserRouter>
                </ToastProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    )
}

export default App
