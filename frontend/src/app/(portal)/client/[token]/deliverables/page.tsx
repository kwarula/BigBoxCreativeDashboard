'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, Search } from 'lucide-react'

const mockDeliverables = [
    { id: 1, name: 'Core Brand Guidelines (V1.2)', type: 'PDF', status: 'ready', size: '4.2 MB' },
    { id: 2, name: 'Main Logo Assets (Standard & Reverse)', type: 'ZIP', status: 'ready', size: '12.4 MB' },
    { id: 3, name: 'Typography Package', type: 'OTF', status: 'ready', size: '1.8 MB' },
    { id: 4, name: 'Social Media Templates', type: 'Figma', status: 'pending', size: null },
    { id: 5, name: 'Pitch Deck Presentation', type: 'PPTX', status: 'in_review', size: '15.0 MB' },
]

export default function ClientDeliverablesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Project Assets</h2>
                    <p className="text-zinc-500 text-sm">Download your finished deliverables and brand materials</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDeliverables.map((item) => (
                    <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-500/10">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                    <p className="text-xs text-zinc-500 uppercase font-medium">{item.type} • {item.size || 'Processing'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.status === 'ready' ? (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                ) : (
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded",
                                        item.status === 'pending' ? "text-zinc-400 bg-zinc-100 dark:bg-zinc-800" : "text-amber-600 bg-amber-50 dark:bg-amber-500/10"
                                    )}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
