import React from 'react';

const priorityColors = {
    critical: 'bg-red-500/20 text-red-600 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    medium: 'bg-green-500/20 text-green-600 border-green-500/30',
    low: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
};

export const PriorityBadge = ({ level }) => {
    const safeLevel = (level || 'low').toLowerCase();
    const bg = priorityColors[safeLevel] || priorityColors.low;

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} backdrop-blur-sm uppercase tracking-wider`}>
            {level || 'Low'}
        </span>
    );
};

export const FlagPill = ({ flag }) => {
    if (!flag) return null;

    return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-tight">
            {String(flag).replace(/_/g, ' ')}
        </span>
    );
};
