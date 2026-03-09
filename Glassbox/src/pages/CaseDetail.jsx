import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
    ArrowLeft,
    Upload,
    Zap,
    Clock,
    BarChart2,
    Users,
    Edit,
    Trash2,
    MoreVertical,
    FileText,
    AlertTriangle,
    MessageSquare,
    Phone,
    MapPin,
    User,
    Smartphone,
    Search,
    Download,
    File,
    X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import Modal from '../components/ui/Modal'
import FileUpload from '../components/ui/FileUpload'
import { StatusBadge } from '../components/ui/Badges'
import CaseForm from '../components/cases/CaseForm'
import EvidenceCard from '../components/evidence/EvidenceCard'
import EvidenceDetail from '../components/evidence/EvidenceDetail'
import EvidenceFilters from '../components/evidence/EvidenceFilters'
import { casesApi, evidenceApi, uploadApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function CaseDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const toast = useToast()

    // Case data
    const [caseData, setCaseData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState([])

    // Evidence data
    const [evidence, setEvidence] = useState([])
    const [evidenceLoading, setEvidenceLoading] = useState(false)
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })

    // Parse URL Search Params for Filters
    const [filters, setFilters] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        const initialFilters = {};
        for (const [key, value] of searchParams.entries()) {
            initialFilters[key] = value;
        }
        return initialFilters;
    })

    const [sources, setSources] = useState([])
    const [tags, setTags] = useState([])

    // UI state
    const [activeTab, setActiveTab] = useState('all')
    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [showUpload, setShowUpload] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showFiles, setShowFiles] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [deletingFileId, setDeletingFileId] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null) // { fileId, fileName }
    const [updating, setUpdating] = useState(false)
    const [showSearchBar, setShowSearchBar] = useState(false)
    const [searchText, setSearchText] = useState('')

    // Load case data
    const loadCase = useCallback(async () => {
        try {
            const [caseResult, summaryResult, sourcesResult, tagsResult] = await Promise.all([
                casesApi.get(id),
                evidenceApi.getSummary(id),
                evidenceApi.getSources(id),
                evidenceApi.getTags(id),
            ])

            setCaseData(caseResult.data)
            setSummary(summaryResult.data || [])
            setSources(sourcesResult.data || [])
            setTags(tagsResult.data || [])
        } catch {
            toast.error('Failed to load case')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }, [id, navigate, toast])

    // Load evidence
    const loadEvidence = useCallback(async () => {
        setEvidenceLoading(true)
        try {
            let result

            if (activeTab === 'high-priority') {
                result = await evidenceApi.getHighPriority(id, {
                    ...filters,
                    page: pagination.page,
                })
            } else if (activeTab === 'bookmarked') {
                result = await evidenceApi.getBookmarked(id)
                // Wrap in standard format
                result = {
                    data: result.data,
                    pagination: { page: 1, total: result.total, pages: 1 },
                }
            } else {
                const tabFilters =
                    activeTab === 'unreviewed' ? { ...filters, reviewed: 'false' } : filters
                result = await evidenceApi.list(id, { ...tabFilters, page: pagination.page })
            }

            setEvidence(result.data || [])
            if (result.pagination) {
                setPagination(result.pagination)
            }
        } catch {
            toast.error('Failed to load evidence')
        } finally {
            setEvidenceLoading(false)
        }
    }, [id, activeTab, filters, pagination.page, toast])

    useEffect(() => {
        loadCase()
    }, [loadCase])

    useEffect(() => {
        if (caseData) {
            loadEvidence()
        }
    }, [caseData, loadEvidence])

    // Handlers
    const handleUpload = async (file) => {
        try {
            const result = await uploadApi.upload(id, file)
            toast.success('File uploaded! Processing...')

            // Poll for status
            const pollStatus = async () => {
                const status = await uploadApi.getStatus(id, result.data.jobId)
                if (status.data.status === 'completed') {
                    toast.success(`Imported ${status.data.savedRecords} evidence items`)
                    loadCase()
                    loadEvidence()
                } else if (status.data.status === 'failed') {
                    toast.error('Upload processing failed')
                } else {
                    setTimeout(pollStatus, 2000)
                }
            }
            setTimeout(pollStatus, 2000)

            setShowUpload(false)
        } catch {
            toast.error('Upload failed')
        }
    }

    const handleAnalyze = async () => {
        setAnalyzing(true)
        try {
            await casesApi.analyze(id)
            toast.success('Analysis started!')

            // Poll for completion
            const pollStatus = async () => {
                const status = await casesApi.getAnalysisStatus(id)
                const latestJob = status.data?.[0]
                if (latestJob?.status === 'completed') {
                    toast.success('Analysis complete!')
                    loadEvidence()
                    setAnalyzing(false)
                } else if (latestJob?.status === 'failed') {
                    toast.error('Analysis failed')
                    setAnalyzing(false)
                } else {
                    setTimeout(pollStatus, 3000)
                }
            }
            setTimeout(pollStatus, 3000)
        } catch (error) {
            toast.error(error.message || 'Failed to start analysis')
            setAnalyzing(false)
        }
    }

    const handleUpdateCase = async (data) => {
        setUpdating(true)
        try {
            await casesApi.update(id, data)
            toast.success('Case updated')
            setShowEdit(false)
            loadCase()
        } catch {
            toast.error('Failed to update case')
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteCase = async () => {
        if (!confirm('Are you sure you want to delete this case and all its evidence?')) return

        try {
            await casesApi.delete(id)
            toast.success('Case deleted')
            navigate('/')
        } catch {
            toast.error('Failed to delete case')
        }
    }

    const handleDeleteFile = (fileId, fileName) => {
        setConfirmDelete({ fileId, fileName })
    }

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return
        const { fileId, fileName } = confirmDelete
        setConfirmDelete(null)
        setDeletingFileId(fileId)
        try {
            const result = await uploadApi.deleteFile(id, fileId)
            toast.success(
                `Removed "${fileName}" and ${result.data?.deletedEvidence || 0} evidence records`
            )
            loadCase()
            loadEvidence()
        } catch {
            toast.error('Failed to delete file')
        } finally {
            setDeletingFileId(null)
        }
    }

    const handleBookmark = async (evidenceId) => {
        try {
            await evidenceApi.toggleBookmark(id, evidenceId)
            setEvidence((prev) =>
                prev.map((e) =>
                    e._id === evidenceId ? { ...e, isBookmarked: !e.isBookmarked } : e
                )
            )
        } catch {
            toast.error('Failed to update bookmark')
        }
    }

    const tabs = [
        { id: 'all', label: 'All', count: caseData?.evidenceCount },
        { id: 'high-priority', label: 'High Priority', count: caseData?.highPriorityCount },
        { id: 'bookmarked', label: 'Bookmarked' },
        { id: 'unreviewed', label: 'Unreviewed' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        )
    }

    if (!caseData) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="btn-ghost btn-icon p-2">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent-primary)] tracking-tight">
                                {caseData.caseName}
                            </h1>
                            <StatusBadge status={caseData.status} />
                        </div>
                        {caseData.caseNumber && (
                            <p className="text-[var(--color-text-secondary)]">
                                Case #{caseData.caseNumber}
                                {caseData.investigator && ` • ${caseData.investigator}`}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        icon={<Edit size={16} />}
                        onClick={() => setShowEdit(true)}
                    >
                        Edit
                    </Button>
                    <Button variant="ghost" icon={<Trash2 size={16} />} onClick={handleDeleteCase}>
                        Delete
                    </Button>
                </div>
            </div>

            {/* Case Info & Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                {/* Case Info */}
                <GlassCard hover={false} className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] mb-4 uppercase tracking-widest border-b border-[var(--color-border-subtle)] pb-2 flex items-center gap-2">
                        <Smartphone size={16} className="text-[var(--color-accent-primary)]" />{' '}
                        Device Information
                    </h3>
                    <div className="space-y-2 text-sm">
                        {caseData.deviceInfo?.deviceType && (
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">Device</span>
                                <span className="text-[var(--color-text-primary)]">
                                    {caseData.deviceInfo.deviceType}
                                </span>
                            </div>
                        )}
                        {caseData.deviceInfo?.owner && (
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">Owner</span>
                                <span className="text-[var(--color-text-primary)]">
                                    {caseData.deviceInfo.owner}
                                </span>
                            </div>
                        )}
                        {caseData.deviceInfo?.imei && (
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">IMEI</span>
                                <span className="text-[var(--color-text-primary)] font-mono text-xs">
                                    {caseData.deviceInfo.imei}
                                </span>
                            </div>
                        )}
                        {caseData.uploadedFiles?.length > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">Files</span>
                                <span className="text-[var(--color-text-primary)]">
                                    {caseData.uploadedFiles.length} uploaded
                                </span>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Evidence Summary */}
                <GlassCard hover={false} className="col-span-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-purple)]/5 to-[var(--color-accent-primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] mb-4 uppercase tracking-widest border-b border-[var(--color-border-subtle)] pb-2 flex items-center gap-2">
                        <BarChart2 size={16} className="text-[var(--color-accent-purple)]" />{' '}
                        Evidence Breakdown
                    </h3>
                    <div className="grid grid-cols-5 gap-3 pt-2">
                        {['message', 'call', 'location', 'contact', 'other'].map((type) => {
                            const typeData = summary.find((s) => s.type === type) || {
                                count: 0,
                                highPriority: 0,
                            }
                            return (
                                <div key={type} className="text-center">
                                    <div className="text-xl font-semibold text-[var(--color-text-primary)]">
                                        {typeData.count}
                                    </div>
                                    <div className="text-xs text-[var(--color-text-secondary)] capitalize">
                                        {type}s
                                    </div>
                                    {typeData.highPriority > 0 && (
                                        <div className="text-xs text-[var(--color-accent-warning)]">
                                            {typeData.highPriority} high
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button icon={<Upload size={16} />} onClick={() => setShowUpload(true)}>
                    Upload File
                </Button>
                <Button
                    variant="secondary"
                    icon={<Zap size={16} />}
                    onClick={handleAnalyze}
                    loading={analyzing}
                    disabled={analyzing}
                >
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                </Button>
                <Button
                    variant={showSearchBar ? 'secondary' : 'ghost'}
                    icon={<Search size={16} />}
                    onClick={() => {
                        setShowSearchBar(!showSearchBar)
                        if (showSearchBar) {
                            setSearchText('')
                            setFilters((prev) => { const { search, ...rest } = prev; return rest; })
                        }
                    }}
                >
                    Search Evidence
                </Button>
                <Link to={`/case/${id}/timeline`}>
                    <Button variant="ghost" icon={<BarChart2 size={16} />}>
                        Timeline
                    </Button>
                </Link>
                <Link to={`/case/${id}/contacts`}>
                    <Button variant="ghost" icon={<Users size={16} />}>
                        Contacts
                    </Button>
                </Link>
            </div>

            {/* Quick Search Bar */}
            {showSearchBar && (
                <div className="glass-card-static p-3 flex items-center gap-3">
                    <Search size={18} className="text-[var(--color-accent-primary)]" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search evidence by text... (type and press Enter)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setFilters((prev) => ({ ...prev, search: searchText }))
                            }
                        }}
                        className="input flex-1"
                    />
                    {searchText && (
                        <button
                            className="btn-ghost btn-icon p-1.5"
                            onClick={() => {
                                setSearchText('')
                                setFilters((prev) => { const { search, ...rest } = prev; return rest; })
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setFilters((prev) => ({ ...prev, search: searchText }))}
                    >
                        Search
                    </Button>
                </div>
            )}
            {/* Uploaded Files Section */}
            {caseData.uploadedFiles?.length > 0 && (
                <GlassCard hover={false} className="relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                            <File size={16} className="text-[var(--color-accent-cyan)]" />
                            Uploaded Files ({caseData.uploadedFiles.length})
                        </h3>
                        <button
                            onClick={() => setShowFiles((v) => !v)}
                            className="btn-ghost btn-icon p-1.5 rounded-lg"
                            title={showFiles ? 'Collapse' : 'Expand'}
                        >
                            <motion.div
                                animate={{ rotate: showFiles ? 0 : -90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ArrowLeft size={14} className="rotate-[-90deg]" />
                            </motion.div>
                        </button>
                    </div>
                    <AnimatePresence>
                        {showFiles && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2">
                                    {caseData.uploadedFiles.map((file) => (
                                        <div
                                            key={file.fileId}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-glass)] transition-all group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center shrink-0">
                                                <FileText
                                                    size={18}
                                                    className="text-[var(--color-accent-primary)]"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                                    {file.originalName}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-2">
                                                    <span>
                                                        {file.size < 1024 * 1024
                                                            ? `${(file.size / 1024).toFixed(1)} KB`
                                                            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {file.recordsImported} records
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(
                                                            file.uploadedAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteFile(
                                                            file.fileId,
                                                            file.originalName
                                                        )
                                                    }
                                                    disabled={
                                                        deletingFileId === file.fileId
                                                    }
                                                    className="btn-ghost btn-icon p-1.5 rounded-lg text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger)]/10 transition-colors"
                                                    title="Delete file and evidence"
                                                >
                                                    {deletingFileId === file.fileId ? (
                                                        <span
                                                            className="spinner"
                                                            style={{
                                                                width: 16,
                                                                height: 16,
                                                            }}
                                                        />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>
            )}

            {/* Evidence Section */}
            <GlassCard hover={false} padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Evidence Feed
                    </h2>
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                {/* Filters */}
                <div className="mb-4">
                    <EvidenceFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        sources={sources}
                        tags={tags}
                    />
                </div>

                {/* Evidence List */}
                {evidenceLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-24 rounded-xl" />
                        ))}
                    </div>
                ) : evidence.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText
                            size={48}
                            className="mx-auto mb-4 text-[var(--color-text-tertiary)]"
                        />
                        <p className="text-[var(--color-text-secondary)]">
                            No evidence found. Upload a forensic export to get started.
                        </p>
                    </div>
                ) : (
                    <motion.div layout className="space-y-3">
                        <AnimatePresence>
                            {evidence.map((item) => (
                                <motion.div
                                    key={item._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <EvidenceCard
                                        evidence={item}
                                        onClick={setSelectedEvidence}
                                        onBookmark={handleBookmark}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </GlassCard>

            {/* Evidence Detail Panel */}
            <AnimatePresence>
                {selectedEvidence && (
                    <EvidenceDetail
                        caseId={id}
                        evidenceId={selectedEvidence}
                        onClose={() => setSelectedEvidence(null)}
                        onUpdate={loadEvidence}
                    />
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <Modal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                title="Upload Forensic Export"
            >
                <div className="p-6">
                    <FileUpload onUpload={handleUpload} />
                    <p className="text-sm text-[var(--color-text-secondary)] mt-4">
                        Supports forensic exports (CSV/Excel), screenshots (OCR), and voice notes
                        (Transcription).
                    </p>
                </div>
            </Modal>

            {/* Edit Case Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Case" size="lg">
                <CaseForm
                    initialData={caseData}
                    onSubmit={handleUpdateCase}
                    onCancel={() => setShowEdit(false)}
                    loading={updating}
                />
            </Modal>

            {/* Delete File Confirmation Modal */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                size="sm"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent-danger)]/10 flex items-center justify-center shrink-0">
                            <Trash2 size={20} className="text-[var(--color-accent-danger)]" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                                Delete File?
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                This will permanently remove{' '}
                                <span className="font-medium text-[var(--color-text-primary)]">
                                    &ldquo;{confirmDelete?.fileName}&rdquo;
                                </span>{' '}
                                and all evidence records imported from it. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setConfirmDelete(null)}
                            className="btn-ghost px-4 py-2 rounded-xl text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-accent-danger)] text-white hover:opacity-90 transition-opacity"
                        >
                            Delete File
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default CaseDetail
