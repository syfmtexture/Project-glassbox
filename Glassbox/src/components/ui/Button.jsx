import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
}

const sizes = {
    sm: 'px-4 py-2 text-xs font-semibold',
    md: 'px-6 py-3 text-sm font-semibold tracking-wide',
    lg: 'px-8 py-4 text-base font-bold tracking-wide break-words',
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
        <motion.button
            whileHover={!loading && !disabled ? { scale: 1.03 } : {}}
            whileTap={!loading && !disabled ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
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
        </motion.button>
    )
}

export default Button
