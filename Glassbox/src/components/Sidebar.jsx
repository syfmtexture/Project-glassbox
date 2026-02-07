import { useState } from 'react';
import { Filter, MessageSquare, Phone, MapPin, User, Image } from 'lucide-react';

export default function Sidebar({ filters, setFilters }) {
    const evidenceTypes = [
        { id: 'message', label: 'Messages', icon: MessageSquare },
        { id: 'call', label: 'Calls', icon: Phone },
        { id: 'location', label: 'Locations', icon: MapPin },
        { id: 'contact', label: 'Contacts', icon: User },
        { id: 'media', label: 'Media', icon: Image },
    ];

    const priorities = [
        { id: 'critical', label: 'Critical (80+)', color: 'var(--critical)' },
        { id: 'high', label: 'High (60-79)', color: 'var(--high)' },
        { id: 'medium', label: 'Medium (40-59)', color: 'var(--medium)' },
        { id: 'low', label: 'Low (0-39)', color: 'var(--low)' },
    ];

    const toggleType = (typeId) => {
        const current = filters.types || [];
        if (current.includes(typeId)) {
            setFilters({ ...filters, types: current.filter(t => t !== typeId) });
        } else {
            setFilters({ ...filters, types: [...current, typeId] });
        }
    };

    const togglePriority = (priorityId) => {
        setFilters({ ...filters, priority: filters.priority === priorityId ? null : priorityId });
    };

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <Filter size={18} />
                <span className="text-title-sm">Filters</span>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">Evidence Type</div>
                {evidenceTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = (filters.types || []).includes(type.id);
                    return (
                        <label key={type.id} className="sidebar-option">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={isActive}
                                onChange={() => toggleType(type.id)}
                            />
                            <Icon size={16} />
                            <span>{type.label}</span>
                        </label>
                    );
                })}
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">Priority Level</div>
                {priorities.map((priority) => (
                    <label key={priority.id} className="sidebar-option">
                        <input
                            type="radio"
                            name="priority"
                            className="checkbox"
                            checked={filters.priority === priority.id}
                            onChange={() => togglePriority(priority.id)}
                        />
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: priority.color
                            }}
                        />
                        <span>{priority.label}</span>
                    </label>
                ))}
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">Quick Filters</div>
                <label className="sidebar-option">
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={filters.bookmarked}
                        onChange={() => setFilters({ ...filters, bookmarked: !filters.bookmarked })}
                    />
                    <span>Bookmarked Only</span>
                </label>
                <label className="sidebar-option">
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={filters.unreviewed}
                        onChange={() => setFilters({ ...filters, unreviewed: !filters.unreviewed })}
                    />
                    <span>Unreviewed Only</span>
                </label>
            </div>

            <button
                className="btn btn-ghost w-full"
                onClick={() => setFilters({ types: [], priority: null, bookmarked: false, unreviewed: false })}
                style={{ marginTop: 16 }}
            >
                Clear Filters
            </button>
        </aside>
    );
}
