import { EmployeeSidebar } from '@/components/layouts/employee-sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
            <EmployeeSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    )
}
