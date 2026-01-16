'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react'

const mockApprovals = [
    { id: 1, type: 'Quote Approval', client: 'TechStart Inc', amount: 15000, date: '2 hours ago' },
    { id: 2, type: 'Creative Review', client: 'Fashion Co', amount: null, date: '5 hours ago' },
    { id: 3, type: 'Media Plan', client: 'Big Retail', amount: 8000, date: 'Yesterday' },
]

export default function EmployeeApprovalsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Approvals</h1>
                <p className="text-zinc-500">Items requiring your review and action</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Pending Approvals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockApprovals.map((approval) => (
                                <div
                                    key={approval.id}
                                    className="flex flex-col gap-4 rounded-lg border border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold">{approval.type}</p>
                                            <span className="text-xs text-zinc-400">•</span>
                                            <span className="text-xs text-zinc-500">{approval.date}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500">{approval.client}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {approval.amount && (
                                            <span className="text-sm font-bold text-green-600">
                                                ${approval.amount.toLocaleString()}
                                            </span>
                                        )}
                                        <Button size="sm" variant="outline">Review Details</Button>
                                        <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Approve</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-zinc-500">Completed Recently</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>No recent approval history found in this session.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
