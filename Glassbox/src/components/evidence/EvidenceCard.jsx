import { Bookmark, BookmarkCheck, Check, Clock, User } from 'lucide-react'
import { PriorityBadge, TypeBadge } from '../ui/Badges'
import { clsx } from 'clsx'

function EvidenceCard({ evidence, onClick, onBookmark, selected = false }) {
    const {
        _id,
        type,
        content,
        sender,
        receiver,
        timestamp,
        duration,
        locationName,
        contactName,
        analysis = {},
        isBookmarked,
        isReviewed,
    } = evidence

    const { priority = 'low', priorityScore = 0, flags = [], summary } = analysis

    const formatTime = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
    }

    const formatDuration = (seconds) => {
        if (!seconds) return ''
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const getTypeContent = () => {
        switch (type) {
            case 'message':
                return (
                    <div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-1">
                            <span>From: {sender || 'Unknown'}</span>
                            {receiver && (
                                <>
                                    <span>→</span>
                                    <span>{receiver}</span>
                                </>
                            )}
                        </div>
                        {content && (
                            <p className="text-sm text-[var(--color-text-primary)] m-0 truncate-2">
                                "{content}"
                            </p>
                        )}
                    </div>
                )

            case 'call':
                return (
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-[var(--color-text-primary)]">
                            {sender && <span>From: {sender}</span>}
                            {receiver && <span>To: {receiver}</span>}
                        </div>
                        {duration && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                Duration: {formatDuration(duration)}
                            </span>
                        )}
                    </div>
                )

            case 'location':
                return (
                    <div className="text-sm text-[var(--color-text-primary)]">
                        📍{' '}
                        {locationName ||
                            `${evidence.latitude?.toFixed(4)}, ${evidence.longitude?.toFixed(4)}`}
                    </div>
                )

            case 'contact':
                return (
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">
                            {contactName || 'Unknown Contact'}
                        </span>
                        {evidence.phoneNumbers?.length > 0 && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                {evidence.phoneNumbers[0]}
                            </span>
                        )}
                    </div>
                )

            default:
                return (
                    <p className="text-sm text-[var(--color-text-primary)] m-0 truncate-2">
                        {content || summary || 'No content'}
                    </p>
                )
        }
    }

    return (
        <div
            className={clsx(
                'glass-card-static p-4 cursor-pointer transition-all duration-200',
                'hover:bg-[var(--color-bg-glass)] hover:shadow-[var(--shadow-glass-hover)]',
                selected && 'ring-2 ring-[var(--color-accent-primary)]',
                isReviewed && 'opacity-70'
            )}
            onClick={() => onClick?.(_id)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <PriorityBadge priority={priority} />
                    <TypeBadge type={type} />
                </div>
                <div className="flex items-center gap-2">
                    {isReviewed && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-accent-success)]">
                            <Check size={12} />
                            Reviewed
                        </span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onBookmark?.(_id)
                        }}
                        className={clsx(
                            'btn-ghost btn-icon p-1.5 transition-colors',
                            isBookmarked && 'text-[var(--color-accent-warning)]'
                        )}
                        title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mb-3">{getTypeContent()}</div>

            {/* Flags */}
            {flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {flags.slice(0, 3).map((flag, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)]"
                        >
                            {flag}
                        </span>
                    ))}
                    {flags.length > 3 && (
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                            +{flags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatTime(timestamp)}</span>
                </div>
                <span>Score: {priorityScore}</span>
            </div>
        </div>
    )
}

export default EvidenceCard
