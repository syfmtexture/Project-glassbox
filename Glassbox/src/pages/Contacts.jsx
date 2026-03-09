import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, MessageSquare, Phone, Search, Mail, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import GlassCard from '../components/ui/GlassCard'
import { casesApi } from '../services/api'
import { useToast } from '../components/ui/Toast'

function Contacts() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const hasFetched = useRef(false)

    const [loading, setLoading] = useState(true)
    const [caseData, setCaseData] = useState(null)
    const [contacts, setContacts] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (hasFetched.current) return
        hasFetched.current = true

        const loadData = async () => {
            setLoading(true)
            try {
                const [caseResult, contactsResult] = await Promise.all([
                    casesApi.get(id),
                    casesApi.getContacts(id, { limit: 50 }),
                ])

                setCaseData(caseResult.data)
                // Backend returns { keyContacts, totalPairs }
                const contactsData = contactsResult.data?.keyContacts || contactsResult.data || []
                setContacts(contactsData)
            } catch (error) {
                console.error('Contacts error:', error)
                toast.error('Failed to load contacts')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [id, toast])

    // Filter contacts by search query
    const filteredContacts = contacts.filter((c) => {
        const name = c.name || c.contactName || c.contact || ''
        const phones = (c.phoneNumbers || []).join(' ')
        const emails = (c.emails || []).join(' ')
        const q = searchQuery.toLowerCase()
        return (
            name.toLowerCase().includes(q) ||
            phones.toLowerCase().includes(q) ||
            emails.toLowerCase().includes(q)
        )
    })

    // Find max for bar scaling - use totalMessages from backend
    const maxMessages = Math.max(
        ...filteredContacts.map((c) => c.totalMessages || c.messageCount || c.count || 0),
        1
    )

    // Stat cards
    const totalContacts = contacts.length
    const totalMessages = contacts.reduce(
        (sum, c) => sum + (c.totalMessages || c.messageCount || c.count || 0),
        0
    )
    const totalCalls = contacts.reduce(
        (sum, c) => sum + (c.totalCalls || c.callCount || 0),
        0
    )

    // Navigate to case evidence filtered by contact
    const handleContactClick = (contact) => {
        const displayName = contact.name || contact.contactName || contact.contact || ''
        navigate(`/case/${id}?search=${encodeURIComponent(displayName)}`)
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
                        Contact Network
                    </h1>
                    <p className="text-[var(--color-text-secondary)] font-medium">
                        {caseData?.caseName} — Communication patterns
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard hover={false} className="flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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

                <GlassCard hover={false} className="flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-purple)]/10 flex items-center justify-center">
                        <MessageSquare size={24} className="text-[var(--color-accent-purple)]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {totalMessages.toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Total Messages
                        </div>
                    </div>
                </GlassCard>

                <GlassCard hover={false} className="flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-success)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-success)]/10 flex items-center justify-center">
                        <Phone size={24} className="text-[var(--color-accent-success)]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                            {totalCalls.toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Total Calls
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Contacts List */}
            <GlassCard hover={false} padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Top Contacts
                    </h2>
                    {/* Search within contacts */}
                    <div className="relative w-64">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                        />
                        <input
                            type="text"
                            placeholder="Filter contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 text-sm"
                        />
                    </div>
                </div>

                {filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                        <Users
                            size={48}
                            className="mx-auto mb-4 text-[var(--color-text-tertiary)]"
                        />
                        <p className="text-[var(--color-text-secondary)]">
                            {searchQuery
                                ? 'No contacts match your search.'
                                : 'No contact data available. Upload evidence to see contact patterns.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredContacts.map((contact, index) => {
                            const messageCount =
                                contact.totalMessages || contact.messageCount || contact.count || 0
                            const callCount = contact.totalCalls || contact.callCount || 0
                            const barWidth = (messageCount / maxMessages) * 100
                            const displayName =
                                contact.name || contact.contactName || contact.contact || 'Unknown'
                            const phoneNumbers = contact.phoneNumbers || []
                            const emails = contact.emails || []
                            const org = contact.organization || ''

                            return (
                                <motion.div
                                    key={contact.name || contact._id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="group p-4 rounded-xl hover:bg-[var(--color-bg-glass)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-border-glass)]"
                                    onClick={() => handleContactClick(contact)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-purple)]/20 flex items-center justify-center text-[var(--color-accent-primary)] font-bold text-lg">
                                                {displayName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                                                    {displayName}
                                                </div>
                                                {/* Phone numbers */}
                                                {phoneNumbers.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                        <Phone size={10} />
                                                        <span>{phoneNumbers.join(', ')}</span>
                                                    </div>
                                                )}
                                                {/* Emails */}
                                                {emails.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                        <Mail size={10} />
                                                        <span>{emails.join(', ')}</span>
                                                    </div>
                                                )}
                                                {/* Org */}
                                                {org && (
                                                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                        <Building2 size={10} />
                                                        <span>{org}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <div className="font-bold text-[var(--color-text-primary)]">
                                                    {messageCount.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-[var(--color-text-secondary)]">
                                                    messages
                                                </div>
                                            </div>
                                            {callCount > 0 && (
                                                <div>
                                                    <div className="font-bold text-[var(--color-accent-purple)]">
                                                        {callCount.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-secondary)]">
                                                        calls
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 bg-[var(--color-border-glass)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barWidth}%` }}
                                            transition={{ duration: 0.5, delay: index * 0.04 }}
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
