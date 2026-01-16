'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Bell, Shield } from 'lucide-react'

export default function EmployeeSettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-zinc-500">Manage your account and dashboard preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-blue-500" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue="Big Box Employee"
                                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Email Role</label>
                                <input
                                    type="email"
                                    defaultValue="PM@bigboxcreative.com"
                                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800"
                                />
                            </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">Update Profile</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            'Email notifications for new tasks',
                            'Browser alerts for approvals',
                            'Weekly summary reports'
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-zinc-100 dark:border-zinc-800">
                                <span className="text-sm font-medium">{item}</span>
                                <div className="h-5 w-10 rounded-full bg-zinc-200 flex items-center px-1 cursor-pointer dark:bg-zinc-800">
                                    <div className="h-3 w-3 rounded-full bg-white shadow-sm transition-transform translate-x-5" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-500 mb-4">Update your password or manage account security settings.</p>
                        <Button variant="outline" size="sm">Change Password</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
