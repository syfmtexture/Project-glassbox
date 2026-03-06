import { clsx } from 'clsx'

function Tabs({ tabs, activeTab, onChange }) {
    return (
        <div className="tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={clsx('tab', activeTab === tab.id && 'active')}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-1.5 text-xs text-[var(--color-text-tertiary)]">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}

export default Tabs
