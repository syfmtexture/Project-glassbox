import { X } from 'lucide-react';
import { useState } from 'react';

export default function NewCaseModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        caseName: '',
        caseNumber: '',
        investigator: '',
        description: '',
        deviceInfo: {
            deviceType: '',
            imei: '',
            owner: '',
            serialNumber: '',
            osVersion: '',
        },
    });
    const [showDeviceInfo, setShowDeviceInfo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('device.')) {
            const field = name.replace('device.', '');
            setFormData(prev => ({
                ...prev,
                deviceInfo: { ...prev.deviceInfo, [field]: value },
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.caseName.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setFormData({
                caseName: '',
                caseNumber: '',
                investigator: '',
                description: '',
                deviceInfo: { deviceType: '', imei: '', owner: '', serialNumber: '', osVersion: '' },
            });
            onClose();
        } catch (err) {
            console.error('Failed to create case:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-card-static modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="modal-title">Create New Case</h2>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label className="form-label">Case Name *</label>
                        <input
                            type="text"
                            name="caseName"
                            className="input"
                            placeholder="e.g., Operation Sunrise"
                            value={formData.caseName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-group">
                            <label className="form-label">Case Number</label>
                            <input
                                type="text"
                                name="caseNumber"
                                className="input"
                                placeholder="e.g., 2024-0847"
                                value={formData.caseNumber}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Investigator</label>
                            <input
                                type="text"
                                name="investigator"
                                className="input"
                                placeholder="Lead investigator name"
                                value={formData.investigator}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            className="input textarea"
                            placeholder="Brief case description..."
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-ghost btn-sm mb-4"
                        onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                    >
                        {showDeviceInfo ? '− Hide' : '+ Add'} Device Information
                    </button>

                    {showDeviceInfo && (
                        <div className="glass-panel p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Device Type</label>
                                    <select
                                        name="device.deviceType"
                                        className="input select"
                                        value={formData.deviceInfo.deviceType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select type</option>
                                        <option value="Phone">Phone</option>
                                        <option value="Tablet">Tablet</option>
                                        <option value="Computer">Computer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IMEI</label>
                                    <input
                                        type="text"
                                        name="device.imei"
                                        className="input"
                                        placeholder="Device IMEI"
                                        value={formData.deviceInfo.imei}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Owner</label>
                                    <input
                                        type="text"
                                        name="device.owner"
                                        className="input"
                                        placeholder="Device owner name"
                                        value={formData.deviceInfo.owner}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Serial Number</label>
                                    <input
                                        type="text"
                                        name="device.serialNumber"
                                        className="input"
                                        placeholder="Device serial"
                                        value={formData.deviceInfo.serialNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">OS Version</label>
                                    <input
                                        type="text"
                                        name="device.osVersion"
                                        className="input"
                                        placeholder="e.g., iOS 17.2"
                                        value={formData.deviceInfo.osVersion}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !formData.caseName.trim()}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
