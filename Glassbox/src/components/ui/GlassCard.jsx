import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { motion } from 'framer-motion'

function GlassCard({
    children,
    className,
    hover = true,
    padding = 'md',
    ...props
}) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
    }

    const baseClasses = twMerge(
        clsx(
            hover ? 'glass-card' : 'glass-card-static',
            paddingClasses[padding],
            className
        )
    )

    if (hover) {
        return (
            <motion.div
                className={baseClasses}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                {...props}
            >
                {children}
            </motion.div>
        )
    }

    return (
        <div className={baseClasses} {...props}>
            {children}
        </div>
    )
}

export default GlassCard
