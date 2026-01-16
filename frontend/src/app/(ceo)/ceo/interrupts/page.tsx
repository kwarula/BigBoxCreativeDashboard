'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InterruptEvent {
    id: string
    event_type: string
    entity_type: string
    created_at: string
    data: any
}

export default function CEOInterruptsPage() {
    const [events, setEvents] = useState<InterruptEvent[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchInterrupts = async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('requires_human', true)
                .order('created_at', { ascending: false })

            if (data) setEvents(data)
            setLoading(false)
        }

        fetchInterrupts()
    }, [])

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
                        Pending Decisions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-zinc-500">Loading queue...</div>
                        ) : events.length === 0 ? (
                            <div className="py-12 text-center text-zinc-500">
                                <CheckCircle2 className="mx-auto h-12 w-12 text-zinc-800 mb-4" />
                                <p>No events require human intervention right now.</p>
                                <p className="text-sm">The engine is running autonomously.</p>
                            </div>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                                                {event.event_type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-zinc-600">•</span>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(event.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-300">
                                            Agent encountered a scenario requiring your approval: {event.entity_type}
                                        </p>
                                        <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-2 text-xs text-zinc-400">
                                            {JSON.stringify(event.data, null, 2)}
                                        </pre>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white">
                                            Details
                                        </Button>
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            Approve
                                        </Button>
                                        <Button size="sm" variant="destructive">
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
