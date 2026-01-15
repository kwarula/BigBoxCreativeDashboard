'use client'

import { use, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Project {
    id: string
    name: string
    progress: number
    end_date: string
}

export default function ClientOverviewPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(token)) {
            setLoading(false)
            return
        }

        const fetchProject = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('id', token)
                .single()

            if (data) setProject(data)
            setLoading(false)
        }

        fetchProject()
    }, [token])

    if (loading) return null
    if (!project) return null

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Status Summary */}
            <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Project Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Overall Progress</span>
                            <span className="font-bold text-emerald-600">{project.progress}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                                className="h-full rounded-full bg-emerald-500 shadow-sm"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="rounded-lg bg-zinc-50 p-3 flex-1 dark:bg-zinc-900">
                            <p className="text-zinc-500">Estimated Completion</p>
                            <p className="font-bold">{project.end_date || 'TBD'}</p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-3 flex-1 dark:bg-zinc-900">
                            <p className="text-zinc-500">Project Status</p>
                            <p className="font-bold uppercase text-emerald-600">Active</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links */}
            <Link href={`/client/${token}/timeline`}>
                <Card className="hover:border-emerald-500 transition-colors cursor-pointer group shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                            Next Milestone
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-500">View upcoming deliverables and timeline.</p>
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
