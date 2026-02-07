import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Zap, BarChart2, Filter, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '../services/api';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import FilterSidebar from '../components/features/FilterSidebar';
import EvidenceList from '../components/features/EvidenceList';
import EvidenceDetail from '../components/features/EvidenceDetail';

const StatCard = ({ label, value, subtext, color = 'text-glass-text' }) => (
    <div className="flex-1 min-w-[120px]">
        <div className="text-xs uppercase font-bold text-glass-textTertiary tracking-wider mb-1">{label}</div>
        <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
        {subtext && <div className="text-[10px] text-glass-textTertiary mt-0.5">{subtext}</div>}
    </div>
);

const CaseDetails = () => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchCaseData();
        fetchStats();
    }, [id]);

    // Fetch evidence when filters change
    useEffect(() => {
        if (caseData) {
            fetchEvidence();
        }
    }, [filters, caseData]);

    const fetchCaseData = async () => {
        try {
            const res = await api.cases.get(id);
            setCaseData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.cases.stats(id);
            setStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEvidence = async () => {
        setLoading(true);
        try {
            const res = await api.evidence.list(id, filters);
            setEvidence(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunAnalysis = async () => {
        try {
            setAnalyzing(true);
            await api.cases.analyze(id);
            // Poll for status or just wait a bit and refresh stats
            setTimeout(() => {
                fetchStats();
                fetchEvidence();
                setAnalyzing(false);
            }, 5000);
        } catch (error) {
            console.error(error);
            setAnalyzing(false);
        }
    };

    if (!caseData) return <div className="p-8 text-center">Loading case...</div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/">
                        <GlassButton variant="ghost" className="px-2.5">
                            <ArrowLeft className="w-5 h-5" />
                        </GlassButton>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-glass-text">{caseData.caseName}</h1>
                        <div className="flex items-center gap-3 text-sm text-glass-textSecondary">
                            <span className="font-mono text-glass-textTertiary">#{caseData.caseNumber}</span>
                            <span className="w-1 h-1 rounded-full bg-glass-textTertiary/50"></span>
                            <span>{caseData.active ? 'Active' : 'Archived'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <GlassButton onClick={handleRunAnalysis} disabled={analyzing} className="gap-2 text-accent-purple border-accent-purple/20 bg-accent-purple/5 hover:bg-accent-purple/10">
                        <Zap className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
                        {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                    </GlassButton>
                    <GlassButton variant="primary" className="gap-2">
                        <Upload className="w-4 h-4" /> Import Data
                    </GlassButton>
                </div>
            </div>

            {/* Stats Bar */}
            <GlassCard className="mb-6 p-5 flex items-center divide-x divide-white/40 shrink-0 overflow-x-auto no-scrollbar">
                <StatCard label="Total Records" value={stats?.totalRecords || 0} />
                <div className="pl-6">
                    <StatCard label="Analyzed" value={`${stats?.analyzed || 0}`} subtext={`${Math.round((stats?.analyzed / (stats?.totalRecords || 1)) * 100)}% Complete`} />
                </div>
                <div className="pl-6">
                    <StatCard label="High Priority" value={stats?.priority?.high || 0} color="text-priority-high" />
                </div>
                <div className="pl-6">
                    <StatCard label="Critical" value={stats?.priority?.critical || 0} color="text-priority-critical" />
                </div>
                <div className="pl-6 flex-1 min-w-[200px]">
                    <div className="text-xs uppercase font-bold text-glass-textTertiary tracking-wider mb-2">Confidence Trend</div>
                    <div className="h-6 w-full bg-white/30 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(stats?.priority?.critical / (stats?.totalRecords || 1)) * 100}%` }} className="bg-priority-critical/70 h-full"></div>
                        <div style={{ width: `${(stats?.priority?.high / (stats?.totalRecords || 1)) * 100}%` }} className="bg-priority-high/60 h-full"></div>
                        <div style={{ width: `${stats?.analyzed ? 100 : 0}%` }} className="bg-glass-textTertiary/20 h-full flex-1"></div>
                    </div>
                </div>
            </GlassCard>

            {/* Main Workspace */}
            <div className="flex-1 flex gap-6 min-h-0 relative">

                {/* Filters (Desktop Sidebar) */}
                <div className={`transition-all duration-300 ${showFilters ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}>
                    <FilterSidebar
                        filters={filters}
                        setFilters={setFilters}
                        className="rounded-2xl"
                    />
                </div>

                {/* Evidence List */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GlassButton onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'primary' : 'ghost'} className="px-3 py-2 text-xs gap-2">
                                <Filter className="w-3.5 h-3.5" /> Filters
                            </GlassButton>
                            <span className="text-xs text-glass-textTertiary font-medium">
                                Showing {evidence.length} records
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GlassButton variant="ghost" className="px-3 py-2 text-xs gap-1.5 text-glass-textSecondary">
                                Newest First <ChevronDown className="w-3 h-3" />
                            </GlassButton>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-10"><div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full"></div></div>
                        ) : (
                            <EvidenceList
                                evidence={evidence}
                                onSelect={setSelectedEvidence}
                                selectedId={selectedEvidence?._id}
                                onBookmark={async (id) => {
                                    await api.evidence.bookmark(caseData._id, id);
                                    // Optimistic update
                                    setEvidence(prev => prev.map(e => e._id === id ? { ...e, isBookmarked: !e.isBookmarked } : e));
                                    if (selectedEvidence?._id === id) {
                                        setSelectedEvidence(prev => ({ ...prev, isBookmarked: !prev.isBookmarked }));
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selectedEvidence && (
                        <EvidenceDetail
                            evidence={selectedEvidence}
                            onClose={() => setSelectedEvidence(null)}
                            onUpdate={(updated) => {
                                setSelectedEvidence(updated);
                                setEvidence(prev => prev.map(e => e._id === updated._id ? updated : e));
                            }}
                        />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default CaseDetails;
