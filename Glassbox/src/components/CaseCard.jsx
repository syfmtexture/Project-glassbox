import { User, Smartphone, FileText, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaseCard({ caseData }) {
    const statusClass = `status-${caseData.status}`;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Link to={`/case/${caseData._id}`} style={{ textDecoration: 'none' }}>
            <div className="glass-card case-card">
                <div className="case-card-header">
                    <div>
                        <div className="case-card-title">{caseData.caseName}</div>
                        {caseData.caseNumber && (
                            <div className="case-card-number">#{caseData.caseNumber}</div>
                        )}
                    </div>
                    <span className={`status-badge ${statusClass}`}>
                        {caseData.status}
                    </span>
                </div>

                <div className="case-card-info">
                    {caseData.investigator && (
                        <div className="case-card-info-row">
                            <User size={14} />
                            <span>{caseData.investigator}</span>
                        </div>
                    )}
                    {caseData.deviceInfo?.deviceType && (
                        <div className="case-card-info-row">
                            <Smartphone size={14} />
                            <span>
                                {caseData.deviceInfo.deviceType}
                                {caseData.deviceInfo.osVersion && ` • ${caseData.deviceInfo.osVersion}`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="case-card-stats">
                    <div className="case-card-stat">
                        <div className="case-card-stat-value">{caseData.evidenceCount || 0}</div>
                        <div className="case-card-stat-label">Evidence</div>
                    </div>
                    <div className="case-card-stat">
                        <div className="case-card-stat-value" style={{ color: 'var(--high)' }}>
                            {caseData.highPriorityCount || 0}
                        </div>
                        <div className="case-card-stat-label">High</div>
                    </div>
                    <div className="case-card-stat">
                        <div className="case-card-stat-value" style={{ color: 'var(--critical)' }}>
                            {caseData.criticalCount || 0}
                        </div>
                        <div className="case-card-stat-label">Critical</div>
                    </div>
                </div>

                <div className="case-card-footer">
                    <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Updated {formatDate(caseData.updatedAt)}
                </div>
            </div>
        </Link>
    );
}
