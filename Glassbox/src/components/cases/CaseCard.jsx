import { Link } from 'react-router-dom'
import { Smartphone, FileText, AlertTriangle, Clock } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import { StatusBadge } from '../ui/Badges'

function CaseCard({ caseData }) {
    const {
        _id,
        caseName,
        caseNumber,
        investigator,
        status = 'active',
        evidenceCount = 0,
        highPriorityCount = 0,
        updatedAt,
        deviceInfo,
    } = caseData

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now - date

        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`

        return date.toLocaleDateString()
    }

    return (
        <Link to={`/case/${_id}`} className="block no-underline">
            <GlassCard className="group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                            <Smartphone size={20} className="text-[var(--color-accent-primary)]" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0 group-hover:text-[var(--color-accent-primary)] transition-colors">
                                {caseName}
                            </h3>
                            {caseNumber && (
                                <p className="text-xs text-[var(--color-text-secondary)] m-0">
                                    Case #{caseNumber}
                                </p>
                            )}
                        </div>
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                        <FileText size={14} />
                        <span>{evidenceCount.toLocaleString()} items</span>
                    </div>
                    {highPriorityCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-accent-warning)]">
                            <AlertTriangle size={14} />
                            <span>{highPriorityCount} high priority</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-glass)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                        {investigator && (
                            <span>{investigator}</span>
                        )}
                        {deviceInfo?.deviceType && (
                            <>
                                <span>•</span>
                                <span>{deviceInfo.deviceType}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                        <Clock size={12} />
                        <span>{formatDate(updatedAt)}</span>
                    </div>
                </div>
            </GlassCard>
        </Link>
    )
}

export default CaseCard
