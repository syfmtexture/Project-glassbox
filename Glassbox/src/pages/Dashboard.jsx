import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import CaseCard from '../components/cases/CaseCard'
import CaseForm from '../components/cases/CaseForm'
import { casesApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function Dashboard() {
    const [cases, setCases] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showNewCase, setShowNewCase] = useState(false)
    const [creating, setCreating] = useState(false)
    const toast = useToast()

    // Stats
    const [stats, setStats] = useState({
        totalCases: 0,
        activeCases: 0,
        totalEvidence: 0,
        highPriority: 0,
    })

    const loadCases = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (search) params.search = search
            if (statusFilter) params.status = statusFilter

            const result = await casesApi.list(params)
            setCases(result.data || [])

            // Calculate stats
            const active = (result.data || []).filter(c => c.status === 'active').length
            const totalEvidence = (result.data || []).reduce((sum, c) => sum + (c.evidenceCount || 0), 0)
            const highPriority = (result.data || []).reduce((sum, c) => sum + (c.highPriorityCount || 0), 0)

            setStats({
                totalCases: result.pagination?.total || result.data?.length || 0,
                activeCases: active,
                totalEvidence,
                highPriority,
            })
        } catch (error) {
            toast.error('Failed to load cases')
        } finally {
            setLoading(false)
        }
    }, [search, statusFilter, toast])

    useEffect(() => {
        loadCases()
    }, [loadCases])

    const handleCreateCase = async (data) => {
        setCreating(true)
        try {
            await casesApi.create(data)
            toast.success('Case created successfully')
            setShowNewCase(false)
            loadCases()
        } catch (error) {
            toast.error(error.message || 'Failed to create case')
        } finally {
            setCreating(false)
        }
    }

    // Stat card animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                        Dashboard
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Forensic triage command center
                    </p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => setShowNewCase(true)}>
                    New Case
                </Button>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-4 gap-4"
            >
                <motion.div variants={itemVariants}>
                    <GlassCard hover={false} className="text-center">
                        <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                            {stats.totalCases}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">Total Cases</div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard hover={false} className="text-center">
                        <div className="text-3xl font-bold text-[var(--color-accent-success)] mb-1">
                            {stats.activeCases}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">Active Cases</div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard hover={false} className="text-center">
                        <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                            {stats.totalEvidence.toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">Evidence Items</div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard hover={false} className="text-center">
                        <div className="text-3xl font-bold text-[var(--color-accent-warning)] mb-1">
                            {stats.highPriority}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">High Priority</div>
                    </GlassCard>
                </motion.div>
            </motion.div>

            {/* Cases Section */}
            <GlassCard hover={false} padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Recent Cases
                    </h2>
                    <button
                        onClick={loadCases}
                        className="btn-ghost btn-icon p-2"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {/* Cases List */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton h-32 rounded-xl" />
                        ))}
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--color-text-secondary)] mb-4">
                            No cases found. Create your first case to get started.
                        </p>
                        <Button onClick={() => setShowNewCase(true)}>
                            Create Case
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 gap-4"
                    >
                        {cases.map((caseData) => (
                            <motion.div key={caseData._id} variants={itemVariants}>
                                <CaseCard caseData={caseData} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </GlassCard>

            {/* New Case Modal */}
            <Modal
                isOpen={showNewCase}
                onClose={() => setShowNewCase(false)}
                title="Create New Case"
                size="lg"
            >
                <CaseForm
                    onSubmit={handleCreateCase}
                    onCancel={() => setShowNewCase(false)}
                    loading={creating}
                />
            </Modal>
        </div>
    )
}

export default Dashboard
