'use client'

import { use, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react'

interface Milestone {
    id: string
    name: string
    status: string
    date: string
}

export default function ClientTimelinePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(token)) {
            setLoading(false)
            return
        }

        const fetchMilestones = async () => {
            const { data } = await supabase
                .from('milestones')
                .select('*')
                .eq('project_id', token)
                .order('date', { ascending: true })

            if (data) setMilestones(data)
            setLoading(false)
        }

        fetchMilestones()
    }, [token])

    if (loading) return null

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    Project Journey
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 px-2">
                    {milestones.length === 0 ? (
                        <p className="py-8 text-center text-zinc-500 text-sm">No milestones defined for this project.</p>
                    ) : (
                        milestones.map((milestone, index) => (
                            <div key={milestone.id} className="flex gap-6">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors",
                                        milestone.status === 'completed'
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-500 dark:bg-emerald-500/10"
                                            : milestone.status === 'in_progress'
                                                ? "bg-amber-50 border-amber-500 text-amber-500 dark:bg-amber-500/10 animate-pulse"
                                                : "bg-zinc-50 border-zinc-200 text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
                                    )}>
                                        {milestone.status === 'completed' ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : milestone.status === 'in_progress' ? (
                                            <Clock className="h-5 w-5" />
                                        ) : (
                                            <Circle className="h-3 w-3 fill-current" />
                                        )}
                                    </div>
                                    {index < milestones.length - 1 && (
                                        <div className="mt-2 h-16 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                                    )}
                                </div>
                                <div className="flex-1 pb-8">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{milestone.name}</p>
                                        <span className="text-xs font-bold text-zinc-400 uppercase">{milestone.date}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {milestone.status === 'completed'
                                            ? 'Successfully delivered and approved.'
                                            : milestone.status === 'in_progress'
                                                ? 'Currently in development.'
                                                : 'Scheduled phase.'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
