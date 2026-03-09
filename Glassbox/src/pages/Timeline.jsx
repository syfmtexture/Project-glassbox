import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, TrendingUp, MessageSquare, Phone, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend as RechartsLegend } from 'recharts'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import { casesApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function Timeline() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const hasFetched = useRef(false)

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [timelineData, setTimelineData] = useState([])
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    })

    const loadData = async (filterDates = dateRange) => {
        setLoading(true)
        try {
            const params = {}
            if (filterDates.startDate) params.startDate = filterDates.startDate
            if (filterDates.endDate) params.endDate = filterDates.endDate

            const [caseResult, timelineResult] = await Promise.all([
                casesApi.get(id),
                casesApi.getTimeline(id, params),
            ])

            setCaseData(caseResult.data)

            // Process timeline data for chart
            const rawData = timelineResult.data || {}
            const processed = processTimelineData(rawData)
            setTimelineData(processed)
        } catch (error) {
            console.error('Timeline error:', error)
            toast.error('Failed to load timeline data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (hasFetched.current) return
        hasFetched.current = true

        loadData()
    }, [id, toast])

    // Process raw timeline data into chart-friendly format
    const processTimelineData = (data) => {
        const dailyData = data?.daily || []

        if (!dailyData || dailyData.length === 0) {
            return []
        }

        // Enforce sorting by date string
        dailyData.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0;
        });

        // Format date string with YEAR included
        return dailyData.map((item) => {
            const dateObj = new Date(item.date);
            const label = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
            });
            return {
                label: label,
                date: item.date,
                messages: item.messages || 0,
                calls: item.calls || 0,
                locations: item.locations || 0,
                total: item.count || 0,
            }
        })
    }

    // Find peak activity
    const peakData = timelineData.reduce(
        (max, item) => (item.total > (max?.total || 0) ? item : max),
        null
    )

    const handleApplyFilter = () => {
        loadData(dateRange)
    }

    const handleClearFilter = () => {
        setDateRange({ startDate: '', endDate: '' })
        loadData({ startDate: '', endDate: '' })
    }

    // Custom Tooltip for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        background: 'rgba(15, 15, 25, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: '14px 18px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <p style={{ color: '#fff', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
                        {label}
                    </p>
                    {payload.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}:
                            </span>
                            <span style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to={`/case/${id}`} className="btn-ghost btn-icon p-2">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-accent-primary)] tracking-tight mb-1">
                        Timeline View
                    </h1>
                    <p className="text-[var(--color-text-secondary)] font-medium">
                        {caseData?.caseName} — Temporal distribution of evidence
                    </p>
                </div>
            </div>

            {/* Date Range Filter */}
            <GlassCard hover={false}>
                <div className="flex items-center gap-4 flex-wrap">
                    <Calendar size={18} className="text-[var(--color-accent-primary)]" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) =>
                                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                            className="input w-auto"
                        />
                        <span className="text-[var(--color-text-secondary)] font-medium">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) =>
                                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                            }
                            className="input w-auto"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleApplyFilter}>
                        Apply
                    </Button>
                    {(dateRange.startDate || dateRange.endDate) && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                            Clear
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Activity Chart — Modern Styled */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <GlassCard hover={false} padding="lg" className="relative overflow-hidden">
                    {/* Decorative gradient corner */}
                    <div
                        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle, var(--color-accent-primary), transparent 70%)',
                        }}
                    />
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <TrendingUp size={20} className="text-[var(--color-accent-primary)]" />
                                Daily Activity
                            </h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Distribution of evidence across dates
                            </p>
                        </div>
                        {timelineData.length > 0 && (
                            <div className="text-right">
                                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {timelineData.reduce((s, d) => s + d.total, 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)]">Total Events</div>
                            </div>
                        )}
                    </div>

                    <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={timelineData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                            >
                                <defs>
                                    <linearGradient id="gradMessages" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0.5} />
                                    </linearGradient>
                                    <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-accent-purple)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--color-accent-purple)" stopOpacity={0.5} />
                                    </linearGradient>
                                    <linearGradient id="gradLocations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-accent-success)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--color-accent-success)" stopOpacity={0.5} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.04)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                                    tickLine={false}
                                    angle={-35}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar
                                    dataKey="messages"
                                    name="Messages"
                                    stackId="a"
                                    fill="url(#gradMessages)"
                                    radius={[0, 0, 0, 0]}
                                    onClick={(data) => {
                                        navigate(`/case/${id}?type=message&startDate=${data.date}&endDate=${data.date}`)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                                <Bar
                                    dataKey="calls"
                                    name="Calls"
                                    stackId="a"
                                    fill="url(#gradCalls)"
                                    radius={[0, 0, 0, 0]}
                                    onClick={(data) => {
                                        navigate(`/case/${id}?type=call&startDate=${data.date}&endDate=${data.date}`)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                                <Bar
                                    dataKey="locations"
                                    name="Locations"
                                    stackId="a"
                                    fill="url(#gradLocations)"
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) => {
                                        navigate(`/case/${id}?type=location&startDate=${data.date}&endDate=${data.date}`)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-8 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-primary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)] font-medium">Messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-purple)]" />
                            <span className="text-sm text-[var(--color-text-secondary)] font-medium">Calls</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-success)]" />
                            <span className="text-sm text-[var(--color-text-secondary)] font-medium">Locations</span>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Peak Activity */}
            {peakData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <GlassCard hover={true} className="cursor-pointer" onClick={() => navigate(`/case/${id}?startDate=${peakData.date}&endDate=${peakData.date}`)}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-warning)]/10 flex items-center justify-center">
                                <span className="text-3xl">⚡</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                    Peak Activity
                                </h3>
                                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                    {peakData.label} — {peakData.total} events
                                </p>
                            </div>
                            <div className="text-right text-sm text-[var(--color-text-secondary)]">
                                Click to view
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <GlassCard
                        hover={true}
                        className="text-center cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate(`/case/${id}?type=message${dateRange.startDate ? `&startDate=${dateRange.startDate}` : ''}${dateRange.endDate ? `&endDate=${dateRange.endDate}` : ''}`)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center mx-auto mb-3">
                            <MessageSquare size={20} className="text-[var(--color-accent-primary)]" />
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-accent-primary)]">
                            {timelineData.reduce((sum, d) => sum + d.messages, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] mt-1">Total Messages</div>
                    </GlassCard>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlassCard
                        hover={true}
                        className="text-center cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate(`/case/${id}?type=call${dateRange.startDate ? `&startDate=${dateRange.startDate}` : ''}${dateRange.endDate ? `&endDate=${dateRange.endDate}` : ''}`)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-purple)]/10 flex items-center justify-center mx-auto mb-3">
                            <Phone size={20} className="text-[var(--color-accent-purple)]" />
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-accent-purple)]">
                            {timelineData.reduce((sum, d) => sum + d.calls, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] mt-1">Total Calls</div>
                    </GlassCard>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <GlassCard
                        hover={true}
                        className="text-center cursor-pointer group relative overflow-hidden"
                        onClick={() => navigate(`/case/${id}?type=location${dateRange.startDate ? `&startDate=${dateRange.startDate}` : ''}${dateRange.endDate ? `&endDate=${dateRange.endDate}` : ''}`)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-success)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-success)]/10 flex items-center justify-center mx-auto mb-3">
                            <MapPin size={20} className="text-[var(--color-accent-success)]" />
                        </div>
                        <div className="text-3xl font-bold text-[var(--color-accent-success)]">
                            {timelineData.reduce((sum, d) => sum + d.locations, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] mt-1">Location Pings</div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    )
}

export default Timeline
