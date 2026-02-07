import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { MessageSquare, Phone, MapPin, User, FileText, Bookmark, Star } from 'lucide-react';
import { FlagPill } from '../ui/Badges';

const getTypeIcon = (type) => {
    switch (type) {
        case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
        case 'call': return <Phone className="w-4 h-4 text-green-500" />;
        case 'location': return <MapPin className="w-4 h-4 text-orange-500" />;
        case 'contact': return <User className="w-4 h-4 text-purple-500" />;
        default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
};

const EvidenceList = ({ evidence = [], onSelect, selectedId, onBookmark }) => {
    if (!evidence || evidence.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
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
                        className={`p-4 cursor-pointer group relative border-l-4 ${selectedId === item._id ? 'bg-white/60 border-blue-500' : 'hover:bg-white/50 border-transparent'
                            }`}
                        onClick={() => onSelect(item)}
                    >
                        <div className="flex gap-4">
                            {/* Icon Column */}
                            <div className="flex flex-col items-center gap-2 pt-1">
                                <div className={`p-2 rounded-lg bg-white/40 shadow-sm ${selectedId === item._id ? 'ring-2 ring-blue-500/20' : ''}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <div className={`text-[10px] font-bold ${(item.analysis?.priorityScore || 0) >= 80 ? 'text-red-500' :
                                        (item.analysis?.priorityScore || 0) >= 60 ? 'text-orange-500' :
                                            'text-gray-400'
                                    }`}>
                                    {item.analysis?.priorityScore || 0}
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-800 truncate">
                                            {item.sender || 'Unknown'}
                                            {item.receiver && <span className="text-gray-500 font-normal"> → {item.receiver}</span>}
                                        </span>
                                        {item.isBookmarked && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 mb-2 font-medium">
                                    {item.content || item.summary || 'No content available'}
                                </p>

                                <div className="flex flex-wrap gap-2 items-center">
                                    {item.source && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/30 border border-white/40 text-gray-500 uppercase">
                                            {item.source}
                                        </span>
                                    )}
                                    {item.analysis?.flags?.map(flag => (
                                        <FlagPill key={flag} flag={flag} />
                                    ))}
                                </div>
                            </div>

                            {/* Action Column */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onBookmark?.(item._id); }}
                                className={`p-2 rounded-full hover:bg-white/50 transition-colors self-start ${item.isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
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
