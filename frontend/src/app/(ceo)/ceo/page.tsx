'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWebSocket } from '@/hooks/useWebSocket'
import { createClient } from '@/lib/supabase'
import {
    Users,
    FolderKanban,
    AlertTriangle,
    TrendingUp,
    Activity,
    Zap,
} from 'lucide-react'

interface SystemHealth {
    status: string
    uptime: number
    agents: Array<{ name: string; active: boolean }>
}

interface RecentEvent {
    event_id: string
    event_type: string
    entity_type: string
    created_at: string
    requires_human: boolean
}

export default function CEODashboard() {
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
    const [connected, setConnected] = useState(false)
    const [counts, setCounts] = useState({ clients: 0, projects: 0 })
    const supabase = createClient()

    useWebSocket({
        onConnect: () => setConnected(true),
        onDisconnect: () => setConnected(false),
        onEvent: (event) => {
            setRecentEvents((prev) => [event as RecentEvent, ...prev.slice(0, 9)])
        },
    })

    useEffect(() => {
        // Fetch health
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/health`)
            .then((res) => res.json())
            .then(setHealth)
            .catch(console.error)

        // Fetch real counts from Supabase
        const fetchCounts = async () => {
            const { count: clientCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })

            const { count: projectCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })

            setCounts({
                clients: clientCount || 0,
                projects: projectCount || 0
            })
        }

        fetchCounts()
    }, [])

    const activeAgents = health?.agents.filter((a) => a.active).length || 0
    const totalAgents = health?.agents.length || 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">CEO Dashboard</h1>
                    <p className="text-zinc-400">
                        God-view of the Big Box Autonomic Engine
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    />
                    <span className="text-sm text-zinc-400">
                        {connected ? 'Live' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Clients"
                    value={counts.clients.toString()}
                    description="Real-time from database"
                    icon={Users}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
                <StatCard
                    title="Active Projects"
                    value={counts.projects.toString()}
                    description="Real-time from database"
                    icon={FolderKanban}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
                <StatCard
                    title="CEO Interrupts"
                    value="3"
                    description="Requiring your attention"
                    icon={AlertTriangle}
                    className="bg-amber-500/10 border-amber-500/20 text-white"
                />
                <StatCard
                    title="Automation Rate"
                    value="68%"
                    description="Target: 85%"
                    icon={Zap}
                    trend={{ value: 5, isPositive: true }}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Agent Status */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Activity className="h-5 w-5 text-green-500" />
                            Agent Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {health?.agents.map((agent) => (
                                <div
                                    key={agent.name}
                                    className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
                                >
                                    <span className="text-sm text-zinc-300">{agent.name}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${agent.active
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {agent.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center text-sm text-zinc-400">
                            {activeAgents}/{totalAgents} agents active
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Events */}
                <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Live Event Stream
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentEvents.length === 0 ? (
                            <div className="flex h-48 items-center justify-center text-zinc-500">
                                Waiting for events...
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentEvents.map((event) => (
                                    <div
                                        key={event.event_id}
                                        className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            {event.requires_human && (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            )}
                                            <span className="text-sm font-medium text-white">
                                                {event.event_type}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {event.entity_type}
                                            </span>
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(event.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
