import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { MessageSquare, Phone, MapPin, User, FileText, Bookmark, Star } from 'lucide-react';
import { PriorityBadge, FlagPill } from '../ui/Badges';

const getTypeIcon = (type) => {
    switch (type) {
        case 'message': return <MessageSquare className="w-4 h-4 text-accent-blue" />;
        case 'call': return <Phone className="w-4 h-4 text-priority-medium" />;
        case 'location': return <MapPin className="w-4 h-4 text-priority-high" />;
        case 'contact': return <User className="w-4 h-4 text-accent-purple" />;
        default: return <FileText className="w-4 h-4 text-glass-textTertiary" />;
    }
};

const EvidenceList = ({ evidence, onSelect, selectedId, onBookmark }) => {
    if (evidence.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-glass-textTertiary">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No evidence found matching filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-20">
            {evidence.map((item) => (
                <motion.div
                    key={item._id}
                    layoutId={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                >
                    <GlassCard
                        className={`p-4 cursor-pointer group relative border-l-4 ${selectedId === item._id ? 'bg-white/60 border-accent-blue shadow-glass-md' : 'hover:bg-white/50 border-transparent'
                            }`}
                        onClick={() => onSelect(item)}
                    >
                        {/* Priority Indicator Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-transparent to-transparent group-hover:via-white/20"></div>

                        <div className="flex gap-4">
                            {/* Icon Column */}
                            <div className="flex flex-col items-center gap-2 pt-1">
                                <div className={`p-2 rounded-lg bg-white/40 shadow-sm ${selectedId === item._id ? 'ring-2 ring-accent-blue/20' : ''}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <div className={`text-[10px] font-bold ${item.analysis?.priorityScore >= 80 ? 'text-priority-critical' :
                                        item.analysis?.priorityScore >= 60 ? 'text-priority-high' :
                                            'text-glass-textTertiary'
                                    }`}>
                                    {item.analysis?.priorityScore || 0}
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-glass-text truncate">
                                            {item.sender || 'Unknown'}
                                            {item.receiver && <span className="text-glass-textTertiary font-normal"> → {item.receiver}</span>}
                                        </span>
                                        {item.isBookmarked && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    </div>
                                    <span className="text-xs text-glass-textTertiary whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <p className="text-sm text-glass-textSecondary line-clamp-2 mb-2 font-medium">
                                    {item.content || item.summary || 'No content available'}
                                </p>

                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/30 border border-white/40 text-glass-textTertiary uppercase">
                                        {item.source}
                                    </span>
                                    {item.analysis?.flags?.map(flag => (
                                        <FlagPill key={flag} flag={flag} />
                                    ))}
                                </div>
                            </div>

                            {/* Action Column */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onBookmark(item._id); }}
                                className={`p-2 rounded-full hover:bg-white/50 transition-colors self-start ${item.isBookmarked ? 'text-yellow-500' : 'text-glass-textTertiary hover:text-yellow-500'}`}
                            >
                                <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-yellow-500' : ''}`} />
                            </button>
                        </div>
                    </GlassCard>
                </motion.div>
            ))}
        </div>
    );
};

export default EvidenceList;
