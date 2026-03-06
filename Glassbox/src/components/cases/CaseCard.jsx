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
            <GlassCard className="group cursor-pointer relative overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)]/10 to-[var(--color-accent-purple)]/10 flex items-center justify-center border border-[var(--color-accent-primary)]/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                <Smartphone
                                    size={24}
                                    className="text-[var(--color-accent-primary)]"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)] m-0 group-hover:text-[var(--color-accent-primary)] transition-colors tracking-tight">
                                    {caseName}
                                </h3>
                                {caseNumber && (
                                    <p className="text-sm font-semibold text-[var(--color-text-tertiary)] m-0 mt-0.5 uppercase tracking-wide">
                                        Case #{caseNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                        <StatusBadge status={status} />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-5 mb-4 text-sm font-medium">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-border-subtle)]/50 text-[var(--color-text-secondary)]">
                            <FileText size={16} />
                            <span>{evidenceCount.toLocaleString()} items</span>
                        </div>
                        {highPriorityCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent-critical)]/10 text-[var(--color-accent-critical)] border border-[var(--color-accent-critical)]/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                <AlertTriangle size={16} />
                                <span>{highPriorityCount} high priority</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
                        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            {investigator && <span>{investigator}</span>}
                            {deviceInfo?.deviceType && (
                                <>
                                    <span className="text-[var(--color-border-glass)]">•</span>
                                    <span>{deviceInfo.deviceType}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] bg-[var(--color-border-subtle)] px-2 py-1 rounded-md">
                            <Clock size={12} />
                            <span>{formatDate(updatedAt)}</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </Link>
    )
}

export default CaseCard
