'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Search, Filter, Plus } from 'lucide-react'

interface Task {
    id: string
    title: string
    priority: string
    due_date: string
    status: string
}

export default function EmployeeTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchTasks = async () => {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setTasks(data)
            setLoading(false)
        }

        fetchTasks()
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Tasks</h1>
                    <p className="text-zinc-500">Manage and track your active assignments</p>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                            Active Tasks
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="h-9 w-64 rounded-md border border-zinc-200 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="py-8 text-center text-zinc-500">Loading tasks...</div>
                        ) : tasks.length === 0 ? (
                            <div className="py-8 text-center text-zinc-500">No tasks found.</div>
                        ) : (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'completed'}
                                            readOnly
                                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className={`text-sm font-medium ${task.status === 'completed' ? 'text-zinc-400 line-through' : ''}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${task.priority === 'high'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                : task.priority === 'medium'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-zinc-500">{task.due_date}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
