'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    CheckSquare,
    Clock,
    AlertCircle,
    TrendingUp,
} from 'lucide-react'

const mockTasks = [
    { id: 1, title: 'Review brand guidelines for Acme Corp', priority: 'high', due: 'Today' },
    { id: 2, title: 'Prepare presentation deck', priority: 'medium', due: 'Tomorrow' },
    { id: 3, title: 'Client feedback review', priority: 'low', due: 'This week' },
]

const mockApprovals = [
    { id: 1, type: 'Quote Approval', client: 'TechStart Inc', amount: 15000 },
    { id: 2, type: 'Creative Review', client: 'Fashion Co', amount: null },
]

export default function EmployeeDashboard() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Good morning! 👋</h1>
                <p className="text-zinc-500">
                    Here&apos;s what&apos;s happening with your work today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="My Tasks"
                    value="8"
                    description="3 due today"
                    icon={CheckSquare}
                />
                <StatCard
                    title="In Progress"
                    value="4"
                    description="2 starting today"
                    icon={Clock}
                />
                <StatCard
                    title="Pending Approvals"
                    value="2"
                    description="Awaiting your review"
                    icon={AlertCircle}
                />
                <StatCard
                    title="Completed This Week"
                    value="12"
                    icon={TrendingUp}
                    trend={{ value: 15, isPositive: true }}
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* My Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                            My Tasks
                        </CardTitle>
                        <Button variant="outline" size="sm">
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-zinc-300"
                                        />
                                        <span className="text-sm font-medium">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${task.priority === 'high'
                                                    ? 'bg-red-100 text-red-700'
                                                    : task.priority === 'medium'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-zinc-100 text-zinc-700'
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-zinc-500">{task.due}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            Pending Approvals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {mockApprovals.map((approval) => (
                                <div
                                    key={approval.id}
                                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{approval.type}</p>
                                        <p className="text-xs text-zinc-500">{approval.client}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {approval.amount && (
                                            <span className="text-sm font-medium text-green-600">
                                                ${approval.amount.toLocaleString()}
                                            </span>
                                        )}
                                        <Button size="sm">Review</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
