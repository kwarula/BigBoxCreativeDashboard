'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Search, Filter } from 'lucide-react'

interface Project {
    id: string
    name: string
    status: string
    progress: number
}

export default function EmployeeProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setProjects(data)
            setLoading(false)
        }

        fetchProjects()
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Projects</h1>
                    <p className="text-zinc-500">Track and manage your active creative projects</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                </div>
                <button className="flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900">
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">No active projects.</div>
                ) : (
                    projects.map((project) => (
                        <Card key={project.id} className="hover:border-blue-500 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{project.name}</CardTitle>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-zinc-500">
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                                            <div
                                                className="h-full rounded-full bg-blue-500 transition-all"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[1, 2].map((i) => (
                                                <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-zinc-200 dark:border-zinc-950" />
                                            ))}
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold text-blue-600 dark:border-zinc-950">
                                                +2
                                            </div>
                                        </div>
                                        <span className="text-xs text-blue-600 font-medium">View Timeline</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
