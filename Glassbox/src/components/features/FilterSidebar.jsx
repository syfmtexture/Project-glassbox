import React from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { X, Check } from 'lucide-react';

const FilterSidebar = ({ filters, setFilters, onClose = () => { }, className = '' }) => {
    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = prev[category] || [];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const isSelected = (category, value) => (filters[category] || []).includes(value);

    return (
        <GlassCard className={`h-full flex flex-col p-0 overflow-hidden ${className}`}>
            <div className="p-4 border-b border-white/40 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                <button onClick={onClose} className="md:hidden p-1">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {/* Evidence Type */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Type</h4>
                    <div className="space-y-2">
                        {['message', 'call', 'location', 'contact', 'other'].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected('type', type) ? 'bg-blue-500 border-blue-500' : 'border-gray-400 group-hover:border-blue-400'}`}>
                                    {isSelected('type', type) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-gray-600 capitalize">{type}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected('type', type)}
                                    onChange={() => toggleFilter('type', type)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Priority</h4>
                    <div className="space-y-2">
                        {['critical', 'high', 'medium', 'low'].map(priority => (
                            <label key={priority} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected('priority', priority) ? 'bg-blue-500 border-blue-500' : 'border-gray-400 group-hover:border-blue-400'}`}>
                                    {isSelected('priority', priority) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-gray-600 capitalize">{priority}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected('priority', priority)}
                                    onChange={() => toggleFilter('priority', priority)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Status</h4>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.bookmarked === 'true' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                                {filters.bookmarked === 'true' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600">Bookmarked Only</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.bookmarked === 'true'}
                                onChange={() => setFilters(prev => ({ ...prev, bookmarked: prev.bookmarked === 'true' ? '' : 'true' }))}
                            />
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.reviewed === 'false' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                                {filters.reviewed === 'false' && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600">Unreviewed Only</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={filters.reviewed === 'false'}
                                onChange={() => setFilters(prev => ({ ...prev, reviewed: prev.reviewed === 'false' ? '' : 'false' }))}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/40">
                <GlassButton variant="ghost" className="w-full text-sm" onClick={() => setFilters({})}>
                    Reset Filters
                </GlassButton>
            </div>
        </GlassCard>
    );
};

export default FilterSidebar;
