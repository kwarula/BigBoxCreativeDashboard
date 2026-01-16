import { CEOSidebar } from '@/components/layouts/ceo-sidebar'

export default function CEOLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-zinc-950">
            <CEOSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    )
}
