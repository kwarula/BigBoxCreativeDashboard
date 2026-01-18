'use client'

import { use, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Download, Calendar, Activity, TrendingUp, Zap, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getClientSignals, getClientTrustScore, getClientProjects } from '@/lib/api'

export default function ClientOverviewPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const [signals, setSignals] = useState<any>(null)
    const [trustScore, setTrustScore] = useState<any>(null)
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Use token as client_id for demo purposes
    const clientId = token

    useEffect(() => {
        loadClientData()
    }, [clientId])

    const loadClientData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [signalsData, trustData, projectsData] = await Promise.all([
                getClientSignals(clientId).catch(() => null),
                getClientTrustScore(clientId).catch(() => null),
                getClientProjects(clientId).catch(() => null),
            ])

            setSignals(signalsData)
            setTrustScore(trustData)
            setProjects(projectsData?.projects || [])
        } catch (err) {
            setError('Failed to load client data. Backend may not be running.')
            console.error('Failed to load client data:', err)
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

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Trust Score */}
            {trustScore && (
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Autonomic Trust Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Overall Trust</span>
                                <span className="font-bold text-emerald-600">
                                    {(trustScore.trust_score * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-emerald-500 shadow-sm"
                                    style={{ width: `${trustScore.trust_score * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                                <p className="text-zinc-500">Transparency</p>
                                <p className="font-bold">
                                    {(trustScore.components.transparency * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                                <p className="text-zinc-500">Reliability</p>
                                <p className="font-bold">
                                    {(trustScore.components.reliability * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                                <p className="text-zinc-500">Proactivity</p>
                                <p className="font-bold">
                                    {(trustScore.components.proactivity * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Autonomic Signals */}
            {signals && (
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            System Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                                <p className="text-xs text-zinc-500 mb-1">Automation Level</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(signals.signals.automation_level * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                                <p className="text-xs text-zinc-500 mb-1">Human Touch Points</p>
                                <p className="text-2xl font-bold">
                                    {signals.signals.human_touch_points}
                                </p>
                            </div>
                            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                                <p className="text-xs text-zinc-500 mb-1">Proactive Actions</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {signals.signals.proactive_interventions}
                                </p>
                            </div>
                            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                                <p className="text-xs text-zinc-500 mb-1">Avg Response</p>
                                <p className="text-2xl font-bold">
                                    {signals.signals.response_time.avg_hours.toFixed(1)}h
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Projects */}
            {projects.length > 0 && (
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800"
                                >
                                    <div>
                                        <p className="font-semibold">{project.name}</p>
                                        <p className="text-sm text-zinc-500">
                                            {project.status} • {project.progress}% complete
                                        </p>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        {(project.automation_rate * 100).toFixed(0)}% automated
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Links */}
            <Link href={`/client/${token}/timeline`}>
                <Card className="hover:border-emerald-500 transition-colors cursor-pointer group shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                            Timeline & History
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-500">View autonomic actions and timeline.</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href={`/client/${token}/deliverables`}>
                <Card className="hover:border-blue-500 transition-colors cursor-pointer group shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-500" />
                            Latest Assets
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-500">Download guidelines, logos, and files.</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
