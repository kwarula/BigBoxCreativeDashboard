'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    FolderKanban,
    Bell,
    Settings,
    LogOut,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Approvals', href: '/dashboard/approvals', icon: Bell },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
    className?: string
}

export function EmployeeSidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn('flex h-full w-64 flex-col bg-white border-r border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800', className)}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600" />
                <span className="text-lg font-bold">Big Box</span>
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
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Employee</p>
                        <p className="text-xs text-zinc-500">Project Manager</p>
                    </div>
                    <button className="text-zinc-400 hover:text-zinc-600">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
