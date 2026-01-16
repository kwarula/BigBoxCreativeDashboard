'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search, MoreVertical } from 'lucide-react'

interface Client {
    id: string
    name: string
    project_count: number
}

export default function EmployeeClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchClients = async () => {
            const { data } = await supabase
                .from('clients')
                .select(`
                    id,
                    name,
                    projects(count)
                `)

            if (data) {
                const formatted = data.map((c: any) => ({
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Clients</h1>
                <p className="text-zinc-500">Directory of Big Box partners you are collaborating with</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">Loading clients...</div>
                ) : clients.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">No clients found.</div>
                ) : (
                    clients.map((client) => (
                        <Card key={client.id} className="hover:border-blue-500 transition-colors cursor-pointer group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <button className="text-zinc-400 hover:text-zinc-600">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <CardContent>
                                <h3 className="font-bold text-lg">{client.name}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-xs text-zinc-500">{client.project_count} Active Projects</p>
                                    <span className="text-xs font-medium text-blue-600 group-hover:underline">View Details</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
