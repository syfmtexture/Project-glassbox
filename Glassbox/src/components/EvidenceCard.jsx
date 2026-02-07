import { MessageSquare, Phone, MapPin, User, Image, FileText, Bookmark, BookmarkCheck } from 'lucide-react';

const typeIcons = {
    message: MessageSquare,
    call: Phone,
    location: MapPin,
    contact: User,
    media: Image,
    other: FileText,
};

const flagLabels = {
    drug_reference: 'Drug',
    violence_threat: 'Violence',
    financial_crime: 'Financial',
    conspiracy: 'Conspiracy',
    evasion: 'Evasion',
    key_entity: 'Entity',
};

export default function EvidenceCard({ evidence, onClick, onBookmark }) {
    const score = evidence.analysis?.priorityScore || 0;
    const priority = evidence.analysis?.priority || 'low';
    const TypeIcon = typeIcons[evidence.type] || FileText;

    const getPriorityColor = () => {
        if (score >= 80) return 'var(--critical)';
        if (score >= 60) return 'var(--high)';
        if (score >= 40) return 'var(--medium)';
        return 'var(--low)';
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="glass-card evidence-card" onClick={onClick}>
            <div className="evidence-card-header">
                <div className="evidence-card-score">
                    <div
                        className="evidence-card-score-value"
                        style={{ color: getPriorityColor() }}
                    >
                        {score}
                    </div>
                    <div className="score-bar" style={{ marginTop: 4 }}>
                        <div
                            className={`score-bar-fill ${priority}`}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                </div>

                <div className="evidence-card-meta">
                    <div className="evidence-card-type">
                        <TypeIcon size={14} />
                        <span style={{ textTransform: 'capitalize' }}>{evidence.type}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span>{evidence.source || 'Unknown'}</span>
                    </div>
                    <div className="evidence-card-time">
                        {formatTime(evidence.timestamp)}
                    </div>
                </div>

                <div className="evidence-card-actions">
                    <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onBookmark?.(evidence._id);
                        }}
                    >
                        {evidence.isBookmarked ? (
                            <BookmarkCheck size={18} style={{ color: 'var(--accent-blue)' }} />
                        ) : (
                            <Bookmark size={18} />
                        )}
                    </button>
                </div>
            </div>

            {(evidence.sender || evidence.receiver) && (
                <div className="evidence-card-parties">
                    {evidence.sender || 'Unknown'} → {evidence.receiver || 'Unknown'}
                </div>
            )}

            {evidence.content && (
                <div className="evidence-card-content">
                    {evidence.content}
                </div>
            )}

            {evidence.analysis?.flags?.length > 0 && (
                <div className="evidence-card-flags">
                    {evidence.analysis.flags.map((flag, i) => (
                        <span
                            key={i}
                            className={`flag-pill ${flag.replace('_', '-').split('_')[0]}`}
                        >
                            {flagLabels[flag] || flag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
