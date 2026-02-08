import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function GlassCard({
    children,
    className,
    hover = true,
    padding = 'md',
    ...props
}) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
    }

    return (
        <div
            className={twMerge(
                clsx(
                    hover ? 'glass-card' : 'glass-card-static',
                    paddingClasses[padding],
                    className
                )
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export default GlassCard
