import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { X, Calendar, MapPin, User, MessageSquare, Tag, Bookmark, Share2, Sparkles } from 'lucide-react';
import { PriorityBadge, FlagPill } from '../ui/Badges';
import { api } from '../../services/api';

const EvidenceDetail = ({ evidence, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    if (!evidence) return null;

    const handleBookmark = async () => {
        try {
            setLoading(true);
            await api.evidence.bookmark(evidence.caseId, evidence._id);
            onUpdate?.({ ...evidence, isBookmarked: !evidence.isBookmarked });
        } catch (error) {
            console.error('Failed to bookmark', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white/60 backdrop-blur-2xl border-l border-white/50 z-30 flex flex-col pt-16"
            style={{ boxShadow: '0 12px 48px rgba(31, 38, 135, 0.12)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/40">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Evidence #{evidence._id?.slice(-6) || 'N/A'}
                        </span>
                        <PriorityBadge level={evidence.analysis?.priority || 'Low'} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 capitalize">{evidence.type || 'Unknown'} Record</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBookmark}
                        disabled={loading}
                        className={`p-2 rounded-full hover:bg-white/50 transition-colors ${evidence.isBookmarked ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-600'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${evidence.isBookmarked ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 transition-colors text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* AI Analysis Summary */}
                <GlassCard className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-3 text-purple-600 font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">AI Analysis</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                        {evidence.analysis?.summary || 'No analysis summary available.'}
                    </p>
                    {evidence.analysis?.flags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-indigo-100/30">
                            {evidence.analysis.flags.map(flag => (
                                <FlagPill key={flag} flag={flag} />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Core Metadata */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/30 border border-white/40">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase">Timestamp</span>
                        </div>
                        <div className="text-sm font-mono text-gray-800">
                            {formatTimestamp(evidence.timestamp)}
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/30 border border-white/40">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold uppercase">Source</span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 capitalize">
                            {evidence.source || 'Unknown'}
                        </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="bg-white/30 rounded-xl border border-white/40 overflow-hidden">
                    <div className="p-3 border-b border-white/30 bg-white/20">
                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Participants
                        </h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-mono uppercase">Sender</span>
                            <span className="text-sm font-semibold text-gray-800">{evidence.sender || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-mono uppercase">Receiver</span>
                            <span className="text-sm font-medium text-gray-800">{evidence.receiver || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* Full Content */}
                <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Content
                    </h3>
                    <div className="p-4 rounded-xl bg-white/40 border border-white/50 text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {evidence.content || 'No text content.'}
                    </div>
                </div>

                {/* Location (if showing) */}
                {evidence.type === 'location' && (evidence.latitude || evidence.longitude) && (
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Coordinates
                        </h3>
                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-emerald-800 font-mono text-xs">
                            LAT: {evidence.latitude || 'N/A'}, LNG: {evidence.longitude || 'N/A'}
                        </div>
                    </div>
                )}

                {/* Entities */}
                {evidence.analysis?.entities?.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" /> Extracted Entities
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {evidence.analysis.entities.map((entity, i) => (
                                <span key={i} className="px-2 py-1 rounded-md bg-white/40 border border-white/50 text-xs text-gray-600">
                                    <span className="font-semibold text-gray-800">{entity.value}</span>
                                    <span className="ml-1 opacity-50 uppercase text-[10px]">({entity.type})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default EvidenceDetail;
