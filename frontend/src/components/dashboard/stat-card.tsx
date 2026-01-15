import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {title}
                </p>
                {Icon && (
                    <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {trend && (
                    <span
                        className={cn(
                            'text-xs font-medium',
                            trend.isPositive ? 'text-green-600' : 'text-red-600'
                        )}
                    >
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>
            {description && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {description}
                </p>
            )}
        </div>
    )
}
