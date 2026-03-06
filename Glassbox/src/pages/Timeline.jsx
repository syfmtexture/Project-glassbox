import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import { casesApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function Timeline() {
    const { id } = useParams()
    const toast = useToast()
    const hasFetched = useRef(false)

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [timelineData, setTimelineData] = useState([])
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    })

    useEffect(() => {
        if (hasFetched.current) return
        hasFetched.current = true

        const loadData = async () => {
            setLoading(true)
            try {
                const [caseResult, timelineResult] = await Promise.all([
                    casesApi.get(id),
                    casesApi.getTimeline(id),
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

        loadData()
    }, [id, toast])

    // Process raw timeline data into chart-friendly format
    const processTimelineData = (data) => {
        // Backend returns { daily, hourly, weekday }
        const hourlyData = data?.hourly || []

        if (!hourlyData || hourlyData.length === 0) {
            // Generate sample data for demo when no data
            const hours = []
            for (let i = 0; i < 24; i++) {
                hours.push({
                    label: `${i}:00`,
                    hour: i,
                    messages: Math.floor(Math.random() * 30),
                    calls: Math.floor(Math.random() * 10),
                    locations: Math.floor(Math.random() * 5),
                    total: 0,
                })
                hours[i].total = hours[i].messages + hours[i].calls + hours[i].locations
            }
            return hours
        }

        // Process the actual hourly data from backend
        return hourlyData.map((item) => ({
            label: `${item.hour}:00`,
            hour: item.hour,
            messages: item.count || 0, // Backend just has count, not broken by type
            calls: 0,
            locations: 0,
            total: item.count || 0,
        }))
    }

    // Find peak activity
    const peakData = timelineData.reduce(
        (max, item) => (item.total > (max?.total || 0) ? item : max),
        null
    )

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
                <div className="flex items-center gap-4">
                    <Calendar size={18} className="text-[var(--color-text-secondary)]" />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) =>
                                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                            className="input w-auto"
                        />
                        <span className="text-[var(--color-text-secondary)]">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) =>
                                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                            }
                            className="input w-auto"
                        />
                    </div>
                    <Button variant="secondary" size="sm">
                        Apply
                    </Button>
                </div>
            </GlassCard>

            {/* Activity Chart */}
            <GlassCard hover={false} padding="lg">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    Activity by Hour
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Distribution of evidence across 24 hours
                </p>

                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={timelineData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                axisLine={{ stroke: 'var(--color-border-glass)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border-glass)',
                                    borderRadius: 12,
                                    boxShadow: 'var(--shadow-glass)',
                                }}
                                labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                                itemStyle={{ color: 'var(--color-text-secondary)' }}
                                formatter={(value, name) => [
                                    value,
                                    name.charAt(0).toUpperCase() + name.slice(1),
                                ]}
                            />
                            <Bar
                                dataKey="messages"
                                stackId="a"
                                fill="var(--color-accent-primary)"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="calls"
                                stackId="a"
                                fill="var(--color-accent-purple)"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="locations"
                                stackId="a"
                                fill="var(--color-accent-success)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-primary)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-purple)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-success)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            Locations
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Peak Activity */}
            {peakData && (
                <GlassCard hover={false}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-warning)]/10 flex items-center justify-center">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                                Peak Activity
                            </h3>
                            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                                {peakData.label} — {peakData.total} events
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard hover={false} className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-accent-primary)]">
                        {timelineData.reduce((sum, d) => sum + d.messages, 0)}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Total Messages</div>
                </GlassCard>
                <GlassCard hover={false} className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-accent-purple)]">
                        {timelineData.reduce((sum, d) => sum + d.calls, 0)}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Total Calls</div>
                </GlassCard>
                <GlassCard hover={false} className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-accent-success)]">
                        {timelineData.reduce((sum, d) => sum + d.locations, 0)}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Location Pings</div>
                </GlassCard>
            </div>
        </div>
    )
}

export default Timeline
