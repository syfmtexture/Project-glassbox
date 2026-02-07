import React from 'react';

const priorityColors = {
    critical: 'bg-priority-critical/20 text-priority-critical border-priority-critical/30',
    high: 'bg-priority-high/20 text-priority-high border-priority-high/30',
    medium: 'bg-priority-medium/20 text-priority-medium border-priority-medium/30',
    low: 'bg-priority-low/20 text-priority-low border-priority-low/30',
};

export const PriorityBadge = ({ level }) => {
    const bg = priorityColors[level.toLowerCase()] || priorityColors.low;

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} backdrop-blur-sm uppercase tracking-wider`}>
            {level}
        </span>
    );
};

export const FlagPill = ({ flag }) => {
    return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-tight">
            {flag.replace('_', ' ')}
        </span>
    );
};
