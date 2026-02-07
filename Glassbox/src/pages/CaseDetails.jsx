import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Zap, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '../services/api';
import GlassButton from '../components/ui/GlassButton';
import GlassCard from '../components/ui/GlassCard';
import FilterSidebar from '../components/features/FilterSidebar';
import EvidenceList from '../components/features/EvidenceList';
import EvidenceDetail from '../components/features/EvidenceDetail';

const StatCard = ({ label, value, subtext, color = 'text-gray-800' }) => (
    <div className="flex-1 min-w-[120px]">
        <div className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
        {subtext && <div className="text-[10px] text-gray-500 mt-0.5">{subtext}</div>}
    </div>
);

const CaseDetails = () => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchCaseData = useCallback(async () => {
        try {
            const res = await api.cases.get(id);
            setCaseData(res.data || res);
        } catch (err) {
            console.error(err);
            setError('Failed to load case data');
        }
    }, [id]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.cases.stats(id);
            setStats(res.data || res);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    const fetchEvidence = useCallback(async () => {
        if (!caseData) return;
        setLoading(true);
        try {
            const res = await api.evidence.list(id, filters);
            setEvidence(res.data || res || []);
        } catch (err) {
            console.error(err);
            setEvidence([]);
        } finally {
            setLoading(false);
        }
    }, [id, filters, caseData]);

    // Fetch initial data
    useEffect(() => {
        fetchCaseData();
        fetchStats();
    }, [fetchCaseData, fetchStats]);

    // Fetch evidence when filters change
    useEffect(() => {
        if (caseData) {
            fetchEvidence();
        }
    }, [fetchEvidence, caseData]);

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
        } catch (err) {
            console.error(err);
            setAnalyzing(false);
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Link to="/">
                    <GlassButton variant="primary">Return to Dashboard</GlassButton>
                </Link>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const totalRecords = stats?.totalRecords || 0;
    const analyzed = stats?.analyzed || 0;
    const percentComplete = totalRecords > 0 ? Math.round((analyzed / totalRecords) * 100) : 0;

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
                        <h1 className="text-2xl font-bold text-gray-800">{caseData.caseName || 'Unnamed Case'}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-mono text-gray-500">#{caseData.caseNumber || 'N/A'}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                            <span>{caseData.status === 'active' ? 'Active' : 'Archived'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <GlassButton
                        onClick={handleRunAnalysis}
                        disabled={analyzing}
                        className="gap-2 text-purple-600 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
                    >
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
                <StatCard label="Total Records" value={totalRecords} />
                <div className="pl-6">
                    <StatCard label="Analyzed" value={analyzed} subtext={`${percentComplete}% Complete`} />
                </div>
                <div className="pl-6">
                    <StatCard label="High Priority" value={stats?.priority?.high || 0} color="text-orange-500" />
                </div>
                <div className="pl-6">
                    <StatCard label="Critical" value={stats?.priority?.critical || 0} color="text-red-500" />
                </div>
                <div className="pl-6 flex-1 min-w-[200px]">
                    <div className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2">Confidence Trend</div>
                    <div className="h-6 w-full bg-white/30 rounded-full overflow-hidden flex">
                        <div style={{ width: `${totalRecords > 0 ? ((stats?.priority?.critical || 0) / totalRecords) * 100 : 0}%` }} className="bg-red-500/70 h-full"></div>
                        <div style={{ width: `${totalRecords > 0 ? ((stats?.priority?.high || 0) / totalRecords) * 100 : 0}%` }} className="bg-orange-500/60 h-full"></div>
                        <div className="bg-gray-300/20 h-full flex-1"></div>
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
                        onClose={() => setShowFilters(false)}
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
                            <span className="text-xs text-gray-500 font-medium">
                                Showing {evidence.length} records
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GlassButton variant="ghost" className="px-3 py-2 text-xs gap-1.5 text-gray-600">
                                Newest First <ChevronDown className="w-3 h-3" />
                            </GlassButton>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-10"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
                        ) : (
                            <EvidenceList
                                evidence={evidence}
                                onSelect={setSelectedEvidence}
                                selectedId={selectedEvidence?._id}
                                onBookmark={async (evidenceId) => {
                                    try {
                                        await api.evidence.bookmark(caseData._id, evidenceId);
                                        // Optimistic update
                                        setEvidence(prev => prev.map(e => e._id === evidenceId ? { ...e, isBookmarked: !e.isBookmarked } : e));
                                        if (selectedEvidence?._id === evidenceId) {
                                            setSelectedEvidence(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : prev);
                                        }
                                    } catch (err) {
                                        console.error('Failed to bookmark', err);
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
                            evidence={{ ...selectedEvidence, caseId: caseData._id }}
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
