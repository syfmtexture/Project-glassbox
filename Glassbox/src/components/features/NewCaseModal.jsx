import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const NewCaseModal = ({ isOpen, onClose, onCaseCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        caseName: '',
        caseNumber: '',
        investigator: '',
        description: '',
        deviceInfo: {
            deviceType: 'Phone',
            imei: '',
            owner: '',
            osVersion: ''
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('device.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                deviceInfo: { ...prev.deviceInfo, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newCase = await api.cases.create(formData);
            onCaseCreated(newCase.data);
            onClose();
        } catch (error) {
            console.error('Failed to create case:', error);
            // Ideally show a toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <GlassCard
                            className="w-full max-w-lg pointer-events-auto shadow-glass-lg border-white/80"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-semibold text-glass-text">New Investigation</h2>
                                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/40 transition-colors">
                                    <X className="w-5 h-5 text-glass-textSecondary" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-glass-textTertiary mb-1.5 pl-1">Case Details</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                name="caseName" value={formData.caseName} onChange={handleChange} placeholder="Case Name *" required
                                                className="glass-input w-full"
                                            />
                                            <input
                                                name="caseNumber" value={formData.caseNumber} onChange={handleChange} placeholder="Case Number"
                                                className="glass-input w-full"
                                            />
                                        </div>
                                    </div>

                                    <input
                                        name="investigator" value={formData.investigator} onChange={handleChange} placeholder="Investigator Name"
                                        className="glass-input w-full"
                                    />

                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange} placeholder="Description / Notes" rows="2"
                                        className="glass-input w-full resize-none"
                                    />

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-glass-textTertiary mb-1.5 pl-1 mt-4">Device Metadata</label>
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <select
                                                name="device.deviceType" value={formData.deviceInfo.deviceType} onChange={handleChange}
                                                className="glass-input w-full appearance-none"
                                            >
                                                <option value="Phone">Smartphone</option>
                                                <option value="Tablet">Tablet</option>
                                                <option value="Computer">Computer</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <input
                                                name="device.osVersion" value={formData.deviceInfo.osVersion} onChange={handleChange} placeholder="OS Version"
                                                className="glass-input w-full"
                                            />
                                        </div>
                                        <input
                                            name="device.owner" value={formData.deviceInfo.owner} onChange={handleChange} placeholder="Device Owner"
                                            className="glass-input w-full mb-2"
                                        />
                                        <input
                                            name="device.imei" value={formData.deviceInfo.imei} onChange={handleChange} placeholder="IMEI / Serial Number"
                                            className="glass-input w-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/40">
                                    <GlassButton type="button" variant="ghost" onClick={onClose}>Cancel</GlassButton>
                                    <GlassButton type="submit" variant="accent" disabled={loading} className="min-w-[120px] flex items-center justify-center">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Case'}
                                    </GlassButton>
                                </div>
                            </form>
                        </GlassCard>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NewCaseModal;
