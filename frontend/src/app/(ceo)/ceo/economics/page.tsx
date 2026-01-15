'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { TrendingUp, Zap, Clock, ShieldCheck } from 'lucide-react'

export default function CEOEconomicsPage() {
    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Economics</h1>
                    <p className="text-zinc-400">ROI and Efficiency analytics of the Autonomic Engine</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Automation ROI"
                    value="$12,450"
                    description="Net savings this month"
                    icon={TrendingUp}
                    trend={{ value: 12, isPositive: true }}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
                <StatCard
                    title="Hours Saved"
                    value="184h"
                    description="Manual labor reduced"
                    icon={Zap}
                    trend={{ value: 8, isPositive: true }}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
                <StatCard
                    title="Avg. Response Time"
                    value="1.2s"
                    description="Human vs AI latency"
                    icon={Clock}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
                <StatCard
                    title="Compliance Score"
                    value="99.8%"
                    description="GDPR & Policy adherence"
                    icon={ShieldCheck}
                    className="bg-emerald-500/10 border-emerald-500/20 text-white"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Efficiency Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[300px] items-center justify-center text-zinc-500">
                            [Chart: Automation Growth vs Operational Cost]
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Token Expenditure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[300px] items-center justify-center text-zinc-500">
                            [Chart: Resource usage per client]
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
