import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
}

const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
}

function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconOnly = false,
    loading = false,
    disabled = false,
    className,
    ...props
}) {
    return (
        <button
            className={twMerge(
                clsx(
                    'btn',
                    variants[variant],
                    sizes[size],
                    iconOnly && 'btn-icon !p-2.5',
                    (loading || disabled) && 'opacity-50 cursor-not-allowed',
                    className
                )
            )}
            disabled={loading || disabled}
            {...props}
        >
            {loading ? (
                <span className="spinner" />
            ) : (
                <>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    {!iconOnly && children}
                </>
            )}
        </button>
    )
}

export default Button
