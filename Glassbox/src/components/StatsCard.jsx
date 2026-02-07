export default function StatsCard({ value, label, sublabel, color, icon: Icon }) {
    return (
        <div className="glass-card-static stat-card">
            {Icon && (
                <div style={{ marginBottom: 8, color: color || 'var(--text-tertiary)' }}>
                    <Icon size={24} />
                </div>
            )}
            <div className="stat-card-value" style={{ color: color }}>
                {value}
            </div>
            <div className="stat-card-label">{label}</div>
            {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
        </div>
    );
}
