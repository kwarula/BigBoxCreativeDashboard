'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { Users, MoreHorizontal, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Client {
    id: string
    name: string
    created_at: string
    project_count: number
}

export default function CEOClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchClients = async () => {
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select(`
                    id,
                    name,
                    created_at,
                    projects(count)
                `)

            if (clientsData) {
                const formatted = clientsData.map((c: any) => ({
                    ...c,
                    project_count: c.projects[0]?.count || 0
                }))
                setClients(formatted)
            }
            setLoading(false)
        }

        fetchClients()
    }, [])

    return (
        <div className="space-y-8 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Clients</h1>
                    <p className="text-zinc-400">Manage and monitor all Big Box partners</p>
                </div>
                <Button className="bg-amber-500 text-black hover:bg-amber-600">
                    Add New Client
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Clients"
                    value={clients.length.toString()}
                    icon={Users}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white">All Clients</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-zinc-800 text-xs font-medium uppercase text-zinc-500">
                                <tr>
                                    <th className="px-4 py-3">Client Name</th>
                                    <th className="px-4 py-3">Active Projects</th>
                                    <th className="px-4 py-3">Client Since</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            Loading clients...
                                        </td>
                                    </tr>
                                ) : clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    clients.map((client) => (
                                        <tr key={client.id} className="hover:bg-zinc-800/50">
                                            <td className="px-4 py-4 font-medium">{client.name}</td>
                                            <td className="px-4 py-4">{client.project_count}</td>
                                            <td className="px-4 py-4">
                                                {new Date(client.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="text-zinc-500 hover:text-white">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
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
