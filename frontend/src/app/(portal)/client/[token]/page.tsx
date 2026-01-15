'use client'

import { use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    CheckCircle2,
    Circle,
    Clock,
    Download,
    FileText,
    Calendar,
} from 'lucide-react'

// Mock data - in production, fetch from API using the token
const mockProject = {
    name: 'Brand Identity Refresh',
    client: 'Acme Corporation',
    status: 'in_progress',
    progress: 65,
    start_date: '2026-01-01',
    end_date: '2026-02-15',
    milestones: [
        { id: 1, name: 'Discovery & Research', status: 'completed', date: '2026-01-05' },
        { id: 2, name: 'Strategy Development', status: 'completed', date: '2026-01-10' },
        { id: 3, name: 'Creative Concepts', status: 'in_progress', date: '2026-01-20' },
        { id: 4, name: 'Design Refinement', status: 'pending', date: '2026-01-30' },
        { id: 5, name: 'Final Delivery', status: 'pending', date: '2026-02-15' },
    ],
    deliverables: [
        { id: 1, name: 'Brand Guidelines PDF', status: 'ready', size: '2.4 MB' },
        { id: 2, name: 'Logo Package', status: 'ready', size: '8.1 MB' },
        { id: 3, name: 'Social Media Kit', status: 'pending', size: null },
    ],
    invoices: [
        { id: 1, number: 'INV-2026-001', amount: 5000, status: 'paid', date: '2026-01-01' },
        { id: 2, number: 'INV-2026-002', amount: 7500, status: 'pending', date: '2026-01-15' },
    ],
}

export default function ClientPortalPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)

    // In production: validate token and fetch project data
    const project = mockProject

    return (
        <div className="space-y-8">
            {/* Project Header */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
                <p className="text-sm font-medium text-emerald-100">Welcome back,</p>
                <h1 className="mt-1 text-3xl font-bold">{project.client}</h1>
                <div className="mt-4 flex items-center gap-6">
                    <div>
                        <p className="text-sm text-emerald-100">Project</p>
                        <p className="font-medium">{project.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-emerald-100">Progress</p>
                        <p className="font-medium">{project.progress}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-emerald-100">Completion</p>
                        <p className="font-medium">{project.end_date}</p>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="h-2 overflow-hidden rounded-full bg-white/20">
                        <div
                            className="h-full rounded-full bg-white transition-all"
                            style={{ width: `${project.progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Timeline */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                            Project Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {project.milestones.map((milestone, index) => (
                                <div key={milestone.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        {milestone.status === 'completed' ? (
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        ) : milestone.status === 'in_progress' ? (
                                            <Clock className="h-6 w-6 text-amber-500" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-zinc-300" />
                                        )}
                                        {index < project.milestones.length - 1 && (
                                            <div className="mt-1 h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">{milestone.name}</p>
                                            <span className="text-sm text-zinc-500">{milestone.date}</span>
                                        </div>
                                        <span
                                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${milestone.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : milestone.status === 'in_progress'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-zinc-100 text-zinc-600'
                                                }`}
                                        >
                                            {milestone.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Deliverables & Invoices */}
                <div className="space-y-6">
                    {/* Deliverables */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Download className="h-5 w-5 text-blue-500" />
                                Deliverables
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {project.deliverables.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-zinc-400" />
                                            <span className="text-sm">{item.name}</span>
                                        </div>
                                        {item.status === 'ready' ? (
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-zinc-400">Pending</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoices */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-5 w-5 text-emerald-500" />
                                Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {project.invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{invoice.number}</p>
                                            <p className="text-xs text-zinc-500">{invoice.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                ${invoice.amount.toLocaleString()}
                                            </p>
                                            <span
                                                className={`text-xs ${invoice.status === 'paid'
                                                        ? 'text-emerald-600'
                                                        : 'text-amber-600'
                                                    }`}
                                            >
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
