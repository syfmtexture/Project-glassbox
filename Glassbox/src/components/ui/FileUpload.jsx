import { useState, useCallback } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button'

function FileUpload({ onUpload, accept = '.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.mp3,.ogg,.wav,.m4a,.opus', disabled = false }) {
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
                        'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 group',
                        dragActive
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 shadow-[0_0_30px_rgba(37,99,235,0.15)] scale-[1.02]'
                            : 'border-[var(--color-border-glass)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-glass)]',
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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-border-subtle)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-[var(--color-accent-primary)]/10">
                        <Upload className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent-primary)] transition-colors duration-300" size={32} />
                    </div>
                    <p className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-cyan)] font-bold tracking-wide">Select files</span> to upload or drag & drop here
                    </p>
                    <p className="text-sm font-medium text-[var(--color-text-tertiary)] tracking-wide">
                        CSV, XLSX, Images (OCR), or Audio (Transcription) (max 100MB)
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
