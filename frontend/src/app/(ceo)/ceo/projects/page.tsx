'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { FolderKanban, Search, Filter } from 'lucide-react'

interface Project {
    id: string
    name: string
    status: string
    progress: number
    staff_in_charge: string
    priority: string
}

export default function CEOProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setProjects(data)
            setLoading(false)
        }

        fetchProjects()
    }, [])

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Projects</h1>
                    <p className="text-zinc-400">Global overview of all agency operations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Live Projects"
                    value={projects.length.toString()}
                    icon={FolderKanban}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Active Pipeline</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                            <button className="flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-400 hover:text-white">
                                <Filter className="h-4 w-4" />
                                Filter
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-zinc-800 text-xs font-medium uppercase text-zinc-500">
                                <tr>
                                    <th className="px-4 py-3">Project Name</th>
                                    <th className="px-4 py-3">Lead</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Progress</th>
                                    <th className="px-4 py-3">Priority</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            Loading projects...
                                        </td>
                                    </tr>
                                ) : projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            No active projects.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map((project) => (
                                        <tr key={project.id} className="hover:bg-zinc-800/50">
                                            <td className="px-4 py-4 font-medium">{project.name}</td>
                                            <td className="px-4 py-4 text-zinc-400">
                                                {project.staff_in_charge || 'Unassigned'}
                                            </td>
                                            <td className="px-4 py-4 uppercase text-xs tracking-wider">
                                                {project.status.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex w-32 items-center gap-2">
                                                    <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
                                                        <div
                                                            className="h-full rounded-full bg-amber-500"
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-zinc-500">{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${project.priority === 'high'
                                                        ? 'bg-red-500/10 text-red-500'
                                                        : project.priority === 'medium'
                                                            ? 'bg-amber-500/10 text-amber-500'
                                                            : 'bg-zinc-500/10 text-zinc-500'
                                                        }`}
                                                >
                                                    {project.priority}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
