'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Calendar,
    Download,
    FileText,
    XCircle
} from 'lucide-react'

interface Project {
    id: string
    name: string
    client: { name: string }
}

export default function ClientProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const pathname = usePathname()
    const [project, setProject] = useState<Project | null>(null)
    const supabase = createClient()

    useEffect(() => {
        // Simple UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(token)) {
            return
        }

        const fetchProject = async () => {
            const { data } = await supabase
                .from('projects')
                .select('name, client:clients(name)')
                .eq('id', token)
                .single()

            if (data) {
                setProject({
                    id: token,
                    name: data.name,
                    client: data.client as { name: string }
                })
            }
        }

        fetchProject()
    }, [token])

    const navItems = [
        { name: 'Overview', href: `/client/${token}`, icon: LayoutDashboard },
        { name: 'Timeline', href: `/client/${token}/timeline`, icon: Calendar },
        { name: 'Deliverables', href: `/client/${token}/deliverables`, icon: Download },
        { name: 'Invoices', href: `/client/${token}/invoices`, icon: FileText },
    ]

    return (
        <div className="space-y-8">
            {/* Project Header */}
            {project && (
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
                    <p className="text-sm font-medium text-emerald-100">Project Portal</p>
                    <h1 className="mt-1 text-3xl font-bold">{project.name}</h1>
                    <p className="mt-1 text-emerald-50 text-sm opacity-90">{project.client.name}</p>

                    {/* Navigation Tabs */}
                    <nav className="mt-8 flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-emerald-50 hover:bg-white/10'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}

            {/* Page Content */}
            <div className="min-h-[400px]">
                {project ? children : (
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 dark:bg-red-500/10">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold">Invalid Portal Access</h2>
                        <p className="mt-2 text-zinc-500 max-w-sm">
                            The security token provided is invalid or has expired. Please use the unique link shared by your Big Box account manager.
                        </p>
                        <Link href="/dashboard" className="mt-6 text-sm font-bold text-emerald-600 hover:underline">
                            Return to Homepage
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
