import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_DURATION = 4000

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const colors = {
    success: 'var(--color-accent-success)',
    error: 'var(--color-accent-critical)',
    warning: 'var(--color-accent-warning)',
    info: 'var(--color-accent-primary)',
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
        setToasts((prev) => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, TOAST_DURATION)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ toast, onClose }) {
    const Icon = icons[toast.type]
    const color = colors[toast.type]

    return (
        <div
            className="glass-card-static flex items-center gap-3 px-4 py-3 min-w-[300px] animate-[slideUp_0.25s_ease]"
            style={{ borderLeft: `3px solid ${color}` }}
        >
            <Icon size={18} style={{ color }} />
            <p className="flex-1 text-sm text-[var(--color-text-primary)] m-0">{toast.message}</p>
            <button onClick={onClose} className="btn-ghost btn-icon p-1">
                <X size={14} />
            </button>
        </div>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export default ToastProvider
