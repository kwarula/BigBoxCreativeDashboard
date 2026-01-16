export default function ClientPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
            {/* Header */}
            <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600" />
                        <span className="text-lg font-bold">Big Box Creative</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        Client Portal
                    </span>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

            {/* Footer */}
            <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-zinc-500">
                    © 2026 Big Box Creative. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
