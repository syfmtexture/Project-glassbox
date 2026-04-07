import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, 
    ShieldCheck, 
    History, 
    FileSpreadsheet, 
    UserPlus, 
    RefreshCcw, 
    Lock, 
    CheckCircle2, 
    XCircle,
    Copy,
    Search,
    Download,
    Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { StatusBadge } from '../components/ui/Badges';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();
    const queryClient = useQueryClient();

    // Queries
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: adminApi.getUsers,
        enabled: activeTab === 'users'
    });

    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ['admin-logs', searchQuery],
        queryFn: () => adminApi.getAuditLogs({ search: searchQuery }),
        enabled: activeTab === 'logs'
    });

    const { data: exportLogs, isLoading: exportsLoading } = useQuery({
        queryKey: ['admin-exports'],
        queryFn: adminApi.getExportLogs,
        enabled: activeTab === 'exports'
    });

    // Mutations
    const toggleStatusMutation = useMutation({
        mutationFn: adminApi.toggleUserStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success('User status updated');
        },
        onError: (err) => toast.error(err.message)
    });

    const createUserMutation = useMutation({
        mutationFn: adminApi.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            toast.success('User created successfully');
            setShowCreateModal(false);
        },
        onError: (err) => toast.error(err.message)
    });

    const tabs = [
        { id: 'users', label: 'User Provisioning', icon: <Users size={16} /> },
        { id: 'logs', label: 'Audit History', icon: <History size={16} /> },
        { id: 'exports', label: 'Chain of Custody', icon: <FileSpreadsheet size={16} /> }
    ];

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
            {/* Admin Header */}
            <div className="flex items-end justify-between border-b border-[var(--color-border-subtle)] pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]">
                            <ShieldCheck size={28} />
                        </div>
                        <h1 className="text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                            Admin <span className="text-gradient">Control Center</span>
                        </h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)] font-medium text-lg">
                        Manage personnel access and monitor forensic data integrity.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button 
                        variant="primary" 
                        icon={<UserPlus size={18} />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Provision User
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center">
                <div className="glass-card-static p-1 flex gap-1 rounded-2xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 font-bold text-sm ${
                                activeTab === tab.id 
                                ? 'bg-[var(--color-accent-primary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/20' 
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'users' && (
                        <div className="grid grid-cols-1 gap-6">
                            <GlassCard hover={false} className="p-0 overflow-hidden">
                                <div className="p-6 bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Personnel Directory</h3>
                                    <div className="text-sm text-[var(--color-text-tertiary)] font-mono">
                                        Total Authorized: {users?.length || 0}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--color-bg-secondary)]/30 text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-bold">
                                            <tr>
                                                <th className="px-6 py-4">User Details</th>
                                                <th className="px-6 py-4">System Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Created</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                            {usersLoading ? (
                                                <tr><td colSpan="5" className="p-12 text-center text-[var(--color-text-tertiary)]"><RefreshCcw className="animate-spin inline-block mr-2" /> Initializing...</td></tr>
                                            ) : users?.map(u => (
                                                <tr key={u._id} className="hover:bg-[var(--color-accent-primary)]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[var(--color-accent-primary)] uppercase">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[var(--color-text-primary)]">{u.name}</p>
                                                                <p className="text-xs font-mono text-[var(--color-text-tertiary)]">{u.userId} • {u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                                                            u.role === 'admin' 
                                                            ? 'bg-purple-100 text-purple-600 border border-purple-200' 
                                                            : 'bg-blue-100 text-blue-600 border border-blue-200'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.isActive ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                                <CheckCircle2 size={14} /> Active
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                                                                <XCircle size={14} /> Suspended
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-[var(--color-text-tertiary)]">
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => toggleStatusMutation.mutate(u.userId)}
                                                            loading={toggleStatusMutation.isPending && toggleStatusMutation.variables === u.userId}
                                                        >
                                                            {u.isActive ? 'Suspend' : 'Reinstate'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by User ID or Action (e.g. EXPORT_FILE)..."
                                        className="input pl-12 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={() => queryClient.invalidateQueries(['admin-logs'])}>
                                    Refresh
                                </Button>
                            </div>

                            <GlassCard hover={false} className="p-0 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--color-bg-secondary)]/30 text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4">Action Event</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4">Source IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border-subtle)] font-mono text-[11px]">
                                            {logsLoading ? (
                                                <tr><td colSpan="5" className="p-12 text-center text-[var(--color-text-tertiary)]"><RefreshCcw className="animate-spin inline-block mr-2" /> Indexing logs...</td></tr>
                                            ) : logs?.logs?.map(log => (
                                                <tr key={log._id} className="hover:bg-[var(--color-bg-glass)] transition-colors">
                                                    <td className="px-6 py-4 text-[var(--color-text-tertiary)]">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-[var(--color-accent-primary)]">
                                                        {log.userId}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                                        {log.description}
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--color-text-tertiary)]">
                                                        {log.ipAddress}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {activeTab === 'exports' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-[var(--color-accent-primary)]/10 to-transparent border border-[var(--color-border-glass)] shadow-lg flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-primary)] flex items-center justify-center text-white shadow-xl shadow-[var(--color-accent-primary)]/20">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Evidence Chain of Custody</h2>
                                    <p className="text-[var(--color-text-secondary)]">Every exported file is cryptographically logged with user identity and IP mapping.</p>
                                </div>
                            </div>

                            <GlassCard hover={false} className="p-0 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--color-bg-secondary)]/30 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-[0.2em] font-black">
                                            <tr>
                                                <th className="px-6 py-5">Forensic Timestamp</th>
                                                <th className="px-6 py-5">Authorizing User</th>
                                                <th className="px-6 py-5">Exported Filename</th>
                                                <th className="px-6 py-5">Metadata Trace</th>
                                                <th className="px-6 py-5 text-right">Verification</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--color-border-subtle)] font-mono text-[11px]">
                                            {exportsLoading ? (
                                                <tr><td colSpan="5" className="p-12 text-center"><RefreshCcw className="animate-spin" /></td></tr>
                                            ) : exportLogs?.logs?.map(log => (
                                                <tr key={log._id} className="hover:bg-emerald-500/5 transition-colors group">
                                                    <td className="px-6 py-4 font-bold">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${log.userRole === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                                            <span className="font-bold">{log.userId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--color-accent-primary)] font-bold">
                                                        {log.metadata?.filename || 'System Report'}
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--color-text-tertiary)] max-w-xs truncate">
                                                        Records: {log.metadata?.recordCount || 'N/A'} • {log.ipAddress}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold text-[9px] uppercase">
                                                            <ShieldCheck size={12} /> Logged
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* User Creation Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Provision New Forensic User"
                size="lg"
            >
                <UserProvisioningForm 
                    onSubmit={(data) => createUserMutation.mutate(data)} 
                    loading={createUserMutation.isPending} 
                    onCancel={() => setShowCreateModal(false)}
                    genPass={generatePassword}
                />
            </Modal>
        </div>
    );
}

function UserProvisioningForm({ onSubmit, loading, onCancel, genPass }) {
    const [formData, setFormData] = useState({
        userId: '',
        name: '',
        email: '',
        password: '',
        role: 'investigator'
    });
    
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleGenPass = () => {
        setFormData(prev => ({ ...prev, password: genPass() }));
        setShowPass(true);
    };

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-[var(--color-text-secondary)] tracking-widest">Full Name</label>
                    <input 
                        type="text" 
                        required 
                        className="input" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-[var(--color-text-secondary)] tracking-widest">User Identifier</label>
                    <input 
                        type="text" 
                        required 
                        className="input" 
                        placeholder="jdoe_forensics"
                        value={formData.userId}
                        onChange={(e) => setFormData(p => ({ ...p, userId: e.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[var(--color-text-secondary)] tracking-widest">Official Email</label>
                <input 
                    type="email" 
                    required 
                    className="input" 
                    placeholder="jdoe@agency.gov"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-[var(--color-text-secondary)] tracking-widest">System Access Level</label>
                    <select 
                        className="input appearance-none"
                        value={formData.role}
                        onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                    >
                        <option value="investigator">Digital Investigator</option>
                        <option value="admin">System Administrator</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-[var(--color-text-secondary)] tracking-widest">Secure Password</label>
                        <button type="button" onClick={handleGenPass} className="text-[10px] text-[var(--color-accent-primary)] font-bold hover:underline">Generate Secure</button>
                    </div>
                    <div className="relative">
                        <input 
                            type={showPass ? "text" : "password"} 
                            required 
                            className="input pr-10" 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                            {showPass ? <Eye size={16} /> : <Lock size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end gap-4 border-t border-[var(--color-border-subtle)]">
                <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" type="submit" loading={loading} className="px-8">Finalize Provisioning</Button>
            </div>
        </form>
    );
}

export default AdminDashboard;
