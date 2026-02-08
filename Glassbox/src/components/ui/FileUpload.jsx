import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button'

function FileUpload({ onUpload, accept = '.csv,.xlsx,.xls', disabled = false }) {
    const [dragActive, setDragActive] = useState(false)
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadComplete, setUploadComplete] = useState(false)

    const handleDrag = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            setUploadComplete(false)
        }
    }, [])

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setUploadComplete(false)
        }
    }

    const handleUpload = async () => {
        if (!file || !onUpload) return

        setUploading(true)
        try {
            await onUpload(file)
            setUploadComplete(true)
            setTimeout(() => {
                setFile(null)
                setUploadComplete(false)
            }, 2000)
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setUploadComplete(false)
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="w-full">
            {!file ? (
                <div
                    className={clsx(
                        'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                        dragActive
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5'
                            : 'border-[var(--color-border-glass)] hover:border-[var(--color-text-tertiary)]',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        disabled={disabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Upload className="mx-auto mb-3 text-[var(--color-text-tertiary)]" size={32} />
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                        <span className="text-[var(--color-accent-primary)] font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                        CSV, XLSX, or XLS (max 100MB)
                    </p>
                </div>
            ) : (
                <div className="glass-card-static p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                        {uploadComplete ? (
                            <CheckCircle size={20} className="text-[var(--color-accent-success)]" />
                        ) : (
                            <File size={20} className="text-[var(--color-accent-primary)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                            {file.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            {formatFileSize(file.size)}
                        </p>
                    </div>
                    {!uploading && !uploadComplete && (
                        <>
                            <Button onClick={handleUpload} size="sm">
                                Upload
                            </Button>
                            <button onClick={clearFile} className="btn-ghost btn-icon p-2">
                                <X size={16} />
                            </button>
                        </>
                    )}
                    {uploading && (
                        <span className="spinner" />
                    )}
                    {uploadComplete && (
                        <span className="text-sm text-[var(--color-accent-success)]">Uploaded!</span>
                    )}
                </div>
            )}
        </div>
    )
}

export default FileUpload
