import { Search, Filter, Calendar } from 'lucide-react'
import { useState } from 'react'
import Button from '../ui/Button'

function EvidenceFilters({ onFilterChange, filters, sources = [], tags = [] }) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value })
    }

    return (
        <div className="space-y-3">
            {/* Search and Quick Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search evidence..."
                        value={filters.search || ''}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className="input pl-10"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={filters.type || ''}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="input w-auto min-w-[140px]"
                >
                    <option value="">All Types</option>
                    <option value="message">Messages</option>
                    <option value="call">Calls</option>
                    <option value="location">Locations</option>
                    <option value="contact">Contacts</option>
                    <option value="media">Media</option>
                </select>

                {/* Priority Filter */}
                <select
                    value={filters.priority || ''}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="input w-auto min-w-[140px]"
                >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <Button
                    variant="ghost"
                    icon={<Filter size={16} />}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    {showAdvanced ? 'Less' : 'More'}
                </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="glass-card-static p-4 grid grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate || ''}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate || ''}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Source Filter */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            Source
                        </label>
                        <select
                            value={filters.source || ''}
                            onChange={(e) => handleChange('source', e.target.value)}
                            className="input"
                        >
                            <option value="">All Sources</option>
                            {sources.map((source, i) => (
                                <option key={i} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            Tag
                        </label>
                        <select
                            value={filters.tag || ''}
                            onChange={(e) => handleChange('tag', e.target.value)}
                            className="input"
                        >
                            <option value="">All Tags</option>
                            {tags.map((tag, i) => (
                                <option key={i} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>

                    {/* Score Range */}
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            Min Score
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={filters.minScore || ''}
                            onChange={(e) => handleChange('minScore', e.target.value)}
                            className="input"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                            Max Score
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={filters.maxScore || ''}
                            onChange={(e) => handleChange('maxScore', e.target.value)}
                            className="input"
                            placeholder="100"
                        />
                    </div>

                    {/* Review Status */}
                    <div className="col-span-2 flex items-end gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.bookmarked === 'true'}
                                onChange={(e) => handleChange('bookmarked', e.target.checked ? 'true' : '')}
                                className="w-4 h-4 rounded border-[var(--color-border-glass)]"
                            />
                            <span className="text-sm text-[var(--color-text-primary)]">Bookmarked only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.reviewed === 'false'}
                                onChange={(e) => handleChange('reviewed', e.target.checked ? 'false' : '')}
                                className="w-4 h-4 rounded border-[var(--color-border-glass)]"
                            />
                            <span className="text-sm text-[var(--color-text-primary)]">Unreviewed only</span>
                        </label>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFilterChange({})}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EvidenceFilters
