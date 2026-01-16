'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    AlertCircle,
    BarChart3,
    Settings,
    LogOut,
} from 'lucide-react'

const navigation = [
    { name: 'Overview', href: '/ceo', icon: LayoutDashboard },
    { name: 'Clients', href: '/ceo/clients', icon: Users },
    { name: 'Projects', href: '/ceo/projects', icon: FolderKanban },
    { name: 'CEO Queue', href: '/ceo/interrupts', icon: AlertCircle },
    { name: 'Economics', href: '/ceo/economics', icon: BarChart3 },
    { name: 'Settings', href: '/ceo/settings', icon: Settings },
]

interface SidebarProps {
    className?: string
}

export function CEOSidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn('flex h-full w-64 flex-col bg-zinc-900', className)}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500" />
                <span className="text-lg font-bold text-white">Big Box</span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-black">
                    CEO
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-zinc-800 text-white'
                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="border-t border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">CEO</p>
                        <p className="text-xs text-zinc-400">God View</p>
                    </div>
                    <button className="text-zinc-400 hover:text-white">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
