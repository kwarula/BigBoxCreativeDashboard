'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCEOInterrupts, resolveCEODecision, type CEOInterrupt } from '@/lib/api'

export default function CEOInterruptsPage() {
    const [interrupts, setInterrupts] = useState<CEOInterrupt[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [resolving, setResolving] = useState<string | null>(null)

    useEffect(() => {
        loadInterrupts()
    }, [])

    const loadInterrupts = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await getCEOInterrupts(50)
            setInterrupts(response.interrupts)
        } catch (err) {
            setError('Failed to load CEO interrupts. Backend may not be running.')
            console.error('Failed to load interrupts:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDecision = async (interruptId: string, decision: 'approved' | 'rejected') => {
        try {
            setResolving(interruptId)
            await resolveCEODecision(interruptId, decision)
            await loadInterrupts()
        } catch (err) {
            console.error('Failed to resolve interrupt:', err)
            alert('Failed to resolve interrupt. Please try again.')
        } finally {
            setResolving(null)
        }
    }

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate)
        return date.toLocaleString()
    }

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">CEO Queue</h1>
                    <p className="text-zinc-400">Decision-required events from the Autonomic Engine</p>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Pending Decisions (Target: &lt;7/week)
                        {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div>
                                <p className="text-sm font-medium text-red-200">{error}</p>
                                <p className="text-xs text-red-300 mt-1">
                                    Make sure the backend is running on http://localhost:3000
                                </p>
                            </div>
                        </div>
                    )}

                    {!error && !loading && interrupts.length === 0 && (
                        <div className="py-12 text-center text-zinc-500">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-zinc-800 mb-4" />
                            <p>No events require human intervention right now.</p>
                            <p className="text-sm">The engine is running autonomously.</p>
                        </div>
                    )}

                    {!error && interrupts.length > 0 && (
                        <div className="space-y-4">
                            {interrupts.map((interrupt) => (
                                <div
                                    key={interrupt.id}
                                    className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                                                {interrupt.type}
                                            </span>
                                            <span className="text-xs text-zinc-600">•</span>
                                            <span className="text-xs text-zinc-500">
                                                {formatDate(interrupt.requested_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-300">{interrupt.description}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                                            <span>Category: {interrupt.category}</span>
                                            <span>•</span>
                                            <span>Agent: {interrupt.agent_id}</span>
                                            <span>•</span>
                                            <span>Confidence: {(interrupt.confidence * 100).toFixed(0)}%</span>
                                            {interrupt.amount && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-400 font-bold">
                                                        ${interrupt.amount.toLocaleString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDecision(interrupt.id, 'rejected')}
                                            disabled={resolving === interrupt.id}
                                        >
                                            {resolving === interrupt.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Reject'
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => handleDecision(interrupt.id, 'approved')}
                                            disabled={resolving === interrupt.id}
                                        >
                                            {resolving === interrupt.id ? (
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
        </div>
    )
}
