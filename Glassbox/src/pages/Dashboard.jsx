import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import NewCaseModal from '../components/features/NewCaseModal';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const fetchCases = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.cases.list({ search });
            setCases(res.data || res || []);
        } catch (err) {
            console.error('Failed to fetch cases', err);
            setError('Failed to load cases. Is the backend running?');
            setCases([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    // Card component for individual case
    const CaseCard = ({ caseData }) => (
        <Link to={`/case/${caseData._id}`}>
            <GlassCard hoverEffect className="h-full flex flex-col justify-between group relative overflow-hidden">
                {/* Decorative gradient blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {caseData.caseName || 'Unnamed Case'}
                            </h3>
                            <p className="text-xs font-mono text-gray-500 mt-0.5">
                                #{caseData.caseNumber || 'NO-REF'}
                            </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${caseData.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                caseData.status === 'archived' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                    'bg-gray-500/10 text-gray-600 border-gray-500/20'
                            }`}>
                            {caseData.status || 'new'}
                        </span>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="w-24 text-gray-500 text-xs uppercase font-semibold">Investigator</span>
                            <span>{caseData.investigator || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="w-24 text-gray-500 text-xs uppercase font-semibold">Device</span>
                            <span>{caseData.deviceInfo?.deviceType || 'Unknown'} {caseData.deviceInfo?.osVersion ? `· ${caseData.deviceInfo.osVersion}` : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/40 mt-auto">
                    <div className="flex gap-2">
                        {(caseData.highPriorityCount || 0) > 0 && (
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-gray-500 font-bold">High</span>
                                <span className="text-lg font-bold text-orange-500">{caseData.highPriorityCount}</span>
                            </div>
                        )}
                        {(caseData.evidenceCount || 0) > 0 && (
                            <div className="flex flex-col ml-3">
                                <span className="text-[10px] uppercase text-gray-500 font-bold">Total</span>
                                <span className="text-lg font-bold text-gray-600">{caseData.evidenceCount}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            </GlassCard>
        </Link>
    );

    return (
        <>
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Investigations
                    </h1>
                    <p className="text-gray-600">
                        Manage your active forensic cases and intelligence operations.
                    </p>
                </div>
                <GlassButton variant="accent" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 pr-5">
                    <Plus className="w-5 h-5" />
                    New Case
                </GlassButton>
            </div>

            {/* Filters & Search Bar */}
            <GlassCard className="mb-8 p-3 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter cases by name, number, or investigator..."
                            className="bg-transparent border-none outline-none text-sm w-full pl-9 pr-4 text-gray-800 placeholder:text-gray-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 border-l border-white/40 pl-4">
                    <button className="p-2 hover:bg-white/40 rounded-lg transition-colors text-gray-600" onClick={fetchCases}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="p-2 hover:bg-white/40 rounded-lg transition-colors text-gray-600">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </GlassCard>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-100/50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Grid */}
            {loading && cases.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map((c) => (
                        <CaseCard key={c._id} caseData={c} />
                    ))}

                    {/* New Case Placeholder Card */}
                    <motion.button
                        onClick={() => setIsModalOpen(true)}
                        className="h-full min-h-[240px] border-2 border-dashed border-white/40 rounded-[20px] flex flex-col items-center justify-center gap-3 text-gray-400 hover:bg-white/20 hover:border-blue-500/30 hover:text-blue-500 transition-all group"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Create New Case</span>
                    </motion.button>
                </div>
            )}

            <NewCaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCaseCreated={(newCase) => {
                    setCases(prev => [newCase, ...prev]);
                }}
            />
        </>
    );
};

export default Dashboard;
