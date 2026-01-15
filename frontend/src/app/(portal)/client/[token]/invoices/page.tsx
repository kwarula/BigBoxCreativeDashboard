'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, CheckCircle, CreditCard } from 'lucide-react'

const mockInvoices = [
    { id: 1, number: 'INV-2026-001', amount: 5000, status: 'paid', date: 'Jan 01, 2026' },
    { id: 2, number: 'INV-2026-002', amount: 7500, status: 'unpaid', date: 'Jan 15, 2026' },
    { id: 3, number: 'INV-2026-003', amount: 12000, status: 'draft', date: 'Feb 01, 2026' },
]

export default function ClientInvoicesPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Billing & Invoices</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Total Balance Card */}
                <Card className="bg-zinc-950 border-zinc-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Outstanding Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">$7,500.00</p>
                        <p className="mt-1 text-xs text-amber-500 font-medium">Due in 5 days</p>
                        <Button className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <CreditCard className="h-4 w-4" />
                            Pay Now
                        </Button>
                    </CardContent>
                </Card>

                {/* Invoices List */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Billing History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockInvoices.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-zinc-50 flex items-center justify-center text-zinc-400 dark:bg-zinc-900">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{invoice.number}</p>
                                            <p className="text-xs text-zinc-500">{invoice.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-bold text-sm">${invoice.amount.toLocaleString()}</p>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                invoice.status === 'paid' ? "text-emerald-600" : invoice.status === 'unpaid' ? "text-amber-600" : "text-zinc-400"
                                            )}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
