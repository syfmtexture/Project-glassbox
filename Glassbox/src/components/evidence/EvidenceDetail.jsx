import { useState, useEffect } from 'react'
import { X, Bookmark, BookmarkCheck, Check, Tag, Clock, User, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { PriorityBadge, TypeBadge } from '../ui/Badges'
import Button from '../ui/Button'
import { evidenceApi } from '../../services/api'
import { useToast } from '../ui/Toast'

function EvidenceDetail({ caseId, evidenceId, onClose, onUpdate }) {
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState('')
    const [newTag, setNewTag] = useState('')
    const [saving, setSaving] = useState(false)
    const toast = useToast()

    useEffect(() => {
        if (evidenceId) {
            loadEvidence()
        }
    }, [evidenceId])

    const loadEvidence = async () => {
        setLoading(true)
        try {
            const result = await evidenceApi.get(caseId, evidenceId)
            setEvidence(result.data)
            setNotes(result.data.notes || '')
        } catch (error) {
            toast.error('Failed to load evidence details')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleBookmark = async () => {
        try {
            await evidenceApi.toggleBookmark(caseId, evidenceId)
            setEvidence(prev => ({ ...prev, isBookmarked: !prev.isBookmarked }))
            onUpdate?.()
        } catch (error) {
            toast.error('Failed to update bookmark')
        }
    }

    const handleMarkReviewed = async () => {
        try {
            await evidenceApi.update(caseId, evidenceId, { isReviewed: true })
            setEvidence(prev => ({ ...prev, isReviewed: true }))
            onUpdate?.()
            toast.success('Marked as reviewed')
        } catch (error) {
            toast.error('Failed to update')
        }
    }

    const handleSaveNotes = async () => {
        setSaving(true)
        try {
            await evidenceApi.update(caseId, evidenceId, { notes })
            toast.success('Notes saved')
            onUpdate?.()
        } catch (error) {
            toast.error('Failed to save notes')
        } finally {
            setSaving(false)
        }
    }

    const handleAddTag = async () => {
        if (!newTag.trim()) return

        const currentTags = evidence.tags || []
        const updatedTags = [...currentTags, newTag.trim()]

        try {
            await evidenceApi.update(caseId, evidenceId, { tags: updatedTags })
            setEvidence(prev => ({ ...prev, tags: updatedTags }))
            setNewTag('')
            onUpdate?.()
        } catch (error) {
            toast.error('Failed to add tag')
        }
    }

    const handleRemoveTag = async (tagToRemove) => {
        const updatedTags = (evidence.tags || []).filter(t => t !== tagToRemove)

        try {
            await evidenceApi.update(caseId, evidenceId, { tags: updatedTags })
            setEvidence(prev => ({ ...prev, tags: updatedTags }))
            onUpdate?.()
        } catch (error) {
            toast.error('Failed to remove tag')
        }
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString()
    }

    if (loading) {
        return (
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[var(--color-bg-secondary)] shadow-2xl z-50 flex items-center justify-center">
                <span className="spinner" />
            </div>
        )
    }

    if (!evidence) return null

    const { type, content, sender, receiver, timestamp, source, analysis = {} } = evidence
    const { priority = 'low', priorityScore = 0, flags = [], summary, sentiment, entities = [] } = analysis

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-lg bg-[var(--color-bg-secondary)] shadow-2xl z-50 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-glass)]">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Evidence Detail
                    </h2>
                    <button onClick={onClose} className="btn-ghost btn-icon p-2">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Type & Priority */}
                    <div className="flex items-center gap-2">
                        <PriorityBadge priority={priority} />
                        <TypeBadge type={type} />
                        {sentiment && (
                            <span className="badge badge-info">{sentiment}</span>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-[var(--color-text-secondary)]">Timestamp</span>
                            <p className="text-[var(--color-text-primary)] m-0">{formatDateTime(timestamp)}</p>
                        </div>
                        <div>
                            <span className="text-[var(--color-text-secondary)]">Source</span>
                            <p className="text-[var(--color-text-primary)] m-0">{source || 'Unknown'}</p>
                        </div>
                        {sender && (
                            <div>
                                <span className="text-[var(--color-text-secondary)]">From</span>
                                <p className="text-[var(--color-text-primary)] m-0">{sender}</p>
                            </div>
                        )}
                        {receiver && (
                            <div>
                                <span className="text-[var(--color-text-secondary)]">To</span>
                                <p className="text-[var(--color-text-primary)] m-0">{receiver}</p>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {content && (
                        <div>
                            <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Content</h4>
                            <div className="glass-card-static p-4">
                                <p className="text-sm text-[var(--color-text-primary)] m-0 whitespace-pre-wrap">
                                    {content}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* AI Analysis */}
                    <div>
                        <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">AI Analysis</h4>
                        <div className="glass-card-static p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-secondary)]">Priority Score</span>
                                <span className="text-lg font-semibold text-[var(--color-text-primary)]">{priorityScore}/100</span>
                            </div>

                            {summary && (
                                <div>
                                    <span className="text-xs text-[var(--color-text-tertiary)]">Summary</span>
                                    <p className="text-sm text-[var(--color-text-primary)] m-0">{summary}</p>
                                </div>
                            )}

                            {flags.length > 0 && (
                                <div>
                                    <span className="text-xs text-[var(--color-text-tertiary)]">Flags</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {flags.map((flag, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)]"
                                            >
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(evidence.tags || []).map((tag, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-[var(--color-accent-critical)]"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                className="input flex-1"
                                placeholder="Add tag..."
                            />
                            <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Notes</h4>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input min-h-[100px] resize-y"
                            placeholder="Add investigation notes..."
                        />
                        <div className="flex justify-end mt-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleSaveNotes}
                                loading={saving}
                            >
                                Save Notes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--color-border-glass)] bg-[var(--color-bg-glass)]">
                    <Button
                        variant={evidence.isBookmarked ? 'primary' : 'secondary'}
                        onClick={handleToggleBookmark}
                        icon={evidence.isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    >
                        {evidence.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </Button>
                    {!evidence.isReviewed && (
                        <Button
                            variant="secondary"
                            onClick={handleMarkReviewed}
                            icon={<Check size={16} />}
                        >
                            Mark Reviewed
                        </Button>
                    )}
                </div>
            </motion.div>
        </>
    )
}

export default EvidenceDetail
