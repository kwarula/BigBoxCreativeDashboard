'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { getApprovals, resolveApproval, type Approval } from '@/lib/api'

export default function EmployeeApprovalsPage() {
    const [approvals, setApprovals] = useState<Approval[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [resolving, setResolving] = useState<string | null>(null)

    useEffect(() => {
        loadApprovals()
    }, [])

    const loadApprovals = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await getApprovals({ status: 'pending' })
            setApprovals(response.approvals)
        } catch (err) {
            setError('Failed to load approvals. Backend may not be running.')
            console.error('Failed to load approvals:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (approvalId: string, decision: 'approved' | 'rejected') => {
        try {
            setResolving(approvalId)
            await resolveApproval(approvalId, decision, undefined, 'employee@bigbox.com')
            await loadApprovals()
        } catch (err) {
            console.error('Failed to resolve approval:', err)
            alert('Failed to resolve approval. Please try again.')
        } finally {
            setResolving(null)
        }
    }

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins} minutes ago`
        if (diffHours < 24) return `${diffHours} hours ago`
        if (diffDays === 1) return 'Yesterday'
        return date.toLocaleDateString()
    }
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
                            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <div>
                                    <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                        Make sure the backend is running on http://localhost:3000
                                    </p>
                                </div>
                            </div>
                        )}

                        {!error && !loading && approvals.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>No pending approvals at this time.</span>
                            </div>
                        )}

                        {!error && approvals.length > 0 && (
                            <div className="space-y-4">
                                {approvals.map((approval) => (
                                    <div
                                        key={approval.id}
                                        className="flex flex-col gap-4 rounded-lg border border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold">{approval.type}</p>
                                                <span className="text-xs text-zinc-400">•</span>
                                                <span className="text-xs text-zinc-500">{formatDate(approval.date)}</span>
                                            </div>
                                            <p className="text-sm text-zinc-500">{approval.client}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-zinc-400">Agent: {approval.agent}</span>
                                                <span className="text-xs text-zinc-400">•</span>
                                                <span className="text-xs text-zinc-400">
                                                    Confidence: {(approval.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {approval.amount && (
                                                <span className="text-sm font-bold text-green-600">
                                                    ${approval.amount.toLocaleString()}
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleResolve(approval.id, 'rejected')}
                                                disabled={resolving === approval.id}
                                            >
                                                {resolving === approval.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Reject'
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                                onClick={() => handleResolve(approval.id, 'approved')}
                                                disabled={resolving === approval.id}
                                            >
                                                {resolving === approval.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Approve'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-zinc-500">Completed Recently</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Approval history will be displayed here in future updates.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
