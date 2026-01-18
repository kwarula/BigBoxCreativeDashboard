'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { TrendingUp, Zap, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { getCEOAutomationReport } from '@/lib/api'

export default function CEOEconomicsPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

    useEffect(() => {
        loadReport()
    }, [period])

    const loadReport = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getCEOAutomationReport(period)
            setReport(data)
        } catch (err) {
            setError('Failed to load automation report. Backend may not be running.')
            console.error('Failed to load report:', err)
        } finally {
            setLoading(false)
        }
    }

    const getPeriodLabel = () => {
        switch (period) {
            case '7d':
                return 'This Week'
            case '30d':
                return 'This Month'
            case '90d':
                return 'This Quarter'
            default:
                return 'This Week'
        }
    }
    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Economics</h1>
                    <p className="text-zinc-400">ROI and Efficiency analytics of the Autonomic Engine</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPeriod('7d')}
                        className={`px-4 py-2 rounded text-sm ${
                            period === '7d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setPeriod('30d')}
                        className={`px-4 py-2 rounded text-sm ${
                            period === '30d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setPeriod('90d')}
                        className={`px-4 py-2 rounded text-sm ${
                            period === '90d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}

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

            {!loading && !error && report && (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Cost Savings"
                            value={`$${report.metrics.cost_savings.toLocaleString()}`}
                            description={`Net savings ${getPeriodLabel()}`}
                            icon={TrendingUp}
                            trend={{ value: 12, isPositive: true }}
                            className="bg-zinc-900 border-zinc-800 text-white"
                        />
                        <StatCard
                            title="Hours Saved"
                            value={`${report.metrics.human_hours_saved.toFixed(1)}h`}
                            description="Manual labor reduced"
                            icon={Zap}
                            trend={{ value: 8, isPositive: true }}
                            className="bg-zinc-900 border-zinc-800 text-white"
                        />
                        <StatCard
                            title="Automation Rate"
                            value={`${(report.metrics.automation_rate * 100).toFixed(1)}%`}
                            description="SOP execution automated"
                            icon={Clock}
                            className="bg-zinc-900 border-zinc-800 text-white"
                        />
                        <StatCard
                            title="CEO Interrupts"
                            value={`${report.ceo_interrupts}/${report.ceo_interrupt_target}`}
                            description={report.status === 'on_track' ? 'On track' : 'Review needed'}
                            icon={report.status === 'on_track' ? TrendingUp : AlertCircle}
                            className={
                                report.status === 'on_track'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
                                    : 'bg-amber-500/10 border-amber-500/20 text-white'
                            }
                        />
                    </div>
                </>
            )}

            {!loading && !error && report && (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Automation Metrics Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">SOP Executions</span>
                                    <span className="text-white font-bold">{report.metrics.sop_executions}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Automation Rate</span>
                                    <span className="text-white font-bold">
                                        {(report.metrics.automation_rate * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                    <span className="text-zinc-400">Human Hours Saved</span>
                                    <span className="text-white font-bold">
                                        {report.metrics.human_hours_saved.toFixed(1)} hours
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-zinc-400">Cost Savings</span>
                                    <span className="text-green-400 font-bold">
                                        ${report.metrics.cost_savings.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    )
}
