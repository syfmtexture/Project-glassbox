import { useState } from 'react'
import Button from '../ui/Button'
import { X } from 'lucide-react'

function CaseForm({ onSubmit, onCancel, initialData = {}, loading = false }) {
    const [formData, setFormData] = useState({
        caseName: initialData.caseName || '',
        caseNumber: initialData.caseNumber || '',
        investigator: initialData.investigator || '',
        description: initialData.description || '',
        deviceType: initialData.deviceInfo?.deviceType || '',
        imei: initialData.deviceInfo?.imei || '',
        owner: initialData.deviceInfo?.owner || '',
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const submitData = {
            caseName: formData.caseName,
            caseNumber: formData.caseNumber || undefined,
            investigator: formData.investigator || undefined,
            description: formData.description || undefined,
            deviceInfo: (formData.deviceType || formData.imei || formData.owner) ? {
                deviceType: formData.deviceType || undefined,
                imei: formData.imei || undefined,
                owner: formData.owner || undefined,
            } : undefined,
        }

        onSubmit(submitData)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                {/* Case Name */}
                <div>
                    <label htmlFor="caseName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                        Case Name <span className="text-[var(--color-accent-critical)]">*</span>
                    </label>
                    <input
                        id="caseName"
                        type="text"
                        name="caseName"
                        value={formData.caseName}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., Smith Investigation"
                        required
                    />
                </div>

                {/* Case Number & Investigator */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="caseNumber" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                            Case Number
                        </label>
                        <input
                            id="caseNumber"
                            type="text"
                            name="caseNumber"
                            value={formData.caseNumber}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., 2024-0892"
                        />
                    </div>
                    <div>
                        <label htmlFor="investigator" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                            Investigator
                        </label>
                        <input
                            id="investigator"
                            type="text"
                            name="investigator"
                            value={formData.investigator}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Det. Johnson"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input min-h-[80px] resize-y"
                        placeholder="Brief description of the case..."
                    />
                </div>

                {/* Device Info Section */}
                <div className="pt-4 border-t border-[var(--color-border-glass)]">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                        Device Information
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="deviceType" className="block text-xs text-[var(--color-text-secondary)] mb-1">
                                Device Type
                            </label>
                            <input
                                id="deviceType"
                                type="text"
                                name="deviceType"
                                value={formData.deviceType}
                                onChange={handleChange}
                                className="input"
                                placeholder="iPhone 14 Pro"
                            />
                        </div>
                        <div>
                            <label htmlFor="imei" className="block text-xs text-[var(--color-text-secondary)] mb-1">
                                IMEI
                            </label>
                            <input
                                id="imei"
                                type="text"
                                name="imei"
                                value={formData.imei}
                                onChange={handleChange}
                                className="input"
                                placeholder="123456789012345"
                            />
                        </div>
                        <div>
                            <label htmlFor="owner" className="block text-xs text-[var(--color-text-secondary)] mb-1">
                                Owner
                            </label>
                            <input
                                id="owner"
                                type="text"
                                name="owner"
                                value={formData.owner}
                                onChange={handleChange}
                                className="input"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-glass)] bg-[var(--color-bg-glass)]">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" loading={loading} disabled={!formData.caseName.trim()}>
                    {initialData._id ? 'Save Changes' : 'Create Case'}
                </Button>
            </div>
        </form>
    )
}

export default CaseForm
