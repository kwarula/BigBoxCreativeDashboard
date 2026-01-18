'use client'

import { use, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Activity, AlertCircle, Loader2 } from 'lucide-react'
import { getClientTimeline } from '@/lib/api'

export default function ClientTimelinePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const [timeline, setTimeline] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const clientId = token

    useEffect(() => {
        loadTimeline()
    }, [clientId])

    const loadTimeline = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getClientTimeline(clientId, 50)
            setTimeline(data.timeline)
        } catch (err) {
            setError('Failed to load timeline. Backend may not be running.')
            console.error('Failed to load timeline:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Make sure the backend is running on http://localhost:3000
                    </p>
                </div>
            </div>
        )
    }

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'milestone':
                return 'bg-emerald-50 border-emerald-500 text-emerald-500 dark:bg-emerald-500/10'
            case 'communication':
                return 'bg-blue-50 border-blue-500 text-blue-500 dark:bg-blue-500/10'
            case 'automation':
                return 'bg-purple-50 border-purple-500 text-purple-500 dark:bg-purple-500/10'
            case 'alert':
                return 'bg-amber-50 border-amber-500 text-amber-500 dark:bg-amber-500/10'
            default:
                return 'bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800'
        }
    }

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Autonomic Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 px-2">
                    {timeline.length === 0 ? (
                        <p className="py-8 text-center text-zinc-500 text-sm">
                            No timeline events yet. Actions will appear here as the system works on your behalf.
                        </p>
                    ) : (
                        timeline.map((event, index) => (
                            <div key={`${event.timestamp}-${index}`} className="flex gap-6">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${getCategoryColor(
                                            event.category
                                        )}`}
                                    >
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    {index < timeline.length - 1 && (
                                        <div className="mt-2 h-16 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                                    )}
                                </div>
                                <div className="flex-1 pb-8">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {event.title}
                                        </p>
                                        <span className="text-xs text-zinc-400">
                                            {formatDate(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-zinc-500">{event.description}</p>
                                    <span className="inline-block mt-2 text-xs font-semibold uppercase px-2 py-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
