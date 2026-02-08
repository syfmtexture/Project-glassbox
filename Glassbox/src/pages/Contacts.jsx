import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, MessageSquare, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import { casesApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function Contacts() {
    const { id } = useParams()
    const toast = useToast()

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [contacts, setContacts] = useState([])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [caseResult, contactsResult] = await Promise.all([
                casesApi.get(id),
                casesApi.getContacts(id, { limit: 50 }),
            ])

            setCaseData(caseResult.data)
            setContacts(contactsResult.data || [])
        } catch (error) {
            toast.error('Failed to load contacts')
        } finally {
            setLoading(false)
        }
    }, [id, toast])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Find max for bar scaling
    const maxMessages = Math.max(...contacts.map(c => c.messageCount || c.count || 0), 1)

    // Stat cards
    const totalContacts = contacts.length
    const totalMessages = contacts.reduce((sum, c) => sum + (c.messageCount || c.count || 0), 0)

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
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        Contact Network
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        {caseData?.caseName} — Communication patterns
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard hover={false} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                        <Users size={24} className="text-[var(--color-accent-primary)]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {totalContacts}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Unique Contacts
                        </div>
                    </div>
                </GlassCard>

                <GlassCard hover={false} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-purple)]/10 flex items-center justify-center">
                        <MessageSquare size={24} className="text-[var(--color-accent-purple)]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {totalMessages.toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Total Interactions
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Contacts List */}
            <GlassCard hover={false} padding="lg">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Top Contacts
                </h2>

                {contacts.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                        <p className="text-[var(--color-text-secondary)]">
                            No contact data available. Upload evidence to see contact patterns.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contacts.map((contact, index) => {
                            const messageCount = contact.messageCount || contact.count || 0
                            const barWidth = (messageCount / maxMessages) * 100

                            return (
                                <motion.div
                                    key={contact._id || contact.contact || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group p-4 rounded-xl hover:bg-[var(--color-bg-glass)] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center text-[var(--color-accent-primary)] font-medium">
                                                {(contact.contactName || contact.contact || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">
                                                    {contact.contactName || contact.contact || 'Unknown'}
                                                </div>
                                                {contact.phoneNumber && (
                                                    <div className="text-xs text-[var(--color-text-secondary)]">
                                                        {contact.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-[var(--color-text-primary)]">
                                                {messageCount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-[var(--color-text-secondary)]">
                                                messages
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-[var(--color-border-glass)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barWidth}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: `linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-purple))`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                <p className="text-xs text-[var(--color-text-tertiary)] text-center mt-4">
                    Click a contact to filter evidence by this sender/receiver
                </p>
            </GlassCard>
        </div>
    )
}

export default Contacts
