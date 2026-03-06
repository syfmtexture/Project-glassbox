import { clsx } from 'clsx'

const priorityStyles = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
}

const typeStyles = {
    message: 'badge-info',
    call: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    location: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    contact: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    media: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusStyles = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function PriorityBadge({ priority, showDot = true }) {
    const labels = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
    }

    const dotColors = {
        critical: 'bg-[var(--color-priority-critical)]',
        high: 'bg-[var(--color-priority-high)]',
        medium: 'bg-[var(--color-priority-medium)]',
        low: 'bg-[var(--color-priority-low)]',
    }

    return (
        <span className={clsx('badge', priorityStyles[priority])}>
            {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[priority])} />}
            {labels[priority]}
        </span>
    )
}

export function TypeBadge({ type }) {
    const labels = {
        message: 'Message',
        call: 'Call',
        location: 'Location',
        contact: 'Contact',
        media: 'Media',
        other: 'Other',
    }

    const icons = {
        message: '💬',
        call: '📞',
        location: '📍',
        contact: '👤',
        media: '🖼️',
        other: '📄',
    }

    return (
        <span className={clsx('badge', typeStyles[type] || typeStyles.other)}>
            <span>{icons[type] || icons.other}</span>
            {labels[type] || type}
        </span>
    )
}

export function StatusBadge({ status }) {
    const labels = {
        active: 'Active',
        archived: 'Archived',
        closed: 'Closed',
    }

    return (
        <span className={clsx('badge', statusStyles[status] || statusStyles.active)}>
            <span
                className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    status === 'active' && 'bg-green-500 animate-pulse',
                    status === 'archived' && 'bg-yellow-500',
                    status === 'closed' && 'bg-gray-500'
                )}
            />
            {labels[status] || status}
        </span>
    )
}

export default { PriorityBadge, TypeBadge, StatusBadge }
