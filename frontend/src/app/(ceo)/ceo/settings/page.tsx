'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Shield, Bell, Database } from 'lucide-react'

export default function CEOSettingsPage() {
    return (
        <div className="space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-zinc-400">Configure the Big Box Autonomic Engine</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-amber-500" />
                            Security & Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <div>
                                <p className="font-medium">Multi-Factor Authentication</p>
                                <p className="text-zinc-500 text-xs">Require MFA for CEO & Admin roles</p>
                            </div>
                            <Button variant="secondary" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Client Portal Expiry</p>
                                <p className="text-zinc-500 text-xs">Default portal token validity (90 days)</p>
                            </div>
                            <input
                                type="number"
                                defaultValue={90}
                                className="w-20 rounded bg-zinc-950 border border-zinc-800 px-2 py-1"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            System Limits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <div>
                                <p className="font-medium">Financial Auto-Approval</p>
                                <p className="text-zinc-500 text-xs">Limits for autonomous budget decisions</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-500 text-xs">$</span>
                                <input
                                    type="number"
                                    defaultValue={5000}
                                    className="w-24 rounded bg-zinc-950 border border-zinc-800 px-2 py-1"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Confidence Threshold</p>
                                <p className="text-zinc-500 text-xs">Minimum AI confidence before requesting human review</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.05"
                                    defaultValue={0.85}
                                    className="w-20 rounded bg-zinc-950 border border-zinc-800 px-2 py-1"
                                />
                                <span className="text-zinc-500 text-xs">%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" className="border-zinc-800">Discard Changes</Button>
                    <Button className="bg-amber-500 text-black hover:bg-amber-600">Save Configuration</Button>
                </div>
            </div>
        </div>
    )
}
