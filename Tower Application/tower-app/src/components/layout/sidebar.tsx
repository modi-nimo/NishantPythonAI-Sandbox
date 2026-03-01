"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
    LayoutDashboard,
    MessageCircle,
    Bell,
    Calendar,
    FileText,
    ShieldCheck,
    Home,
    ChevronRight
} from "lucide-react"
import { cn } from "@/utils/cn"

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Issues Center", href: "/complaints", icon: MessageCircle },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Notices", href: "/notices", icon: Bell },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Admin Portal", href: "/admin", icon: ShieldCheck },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass hidden lg:flex flex-col z-50 p-6 border-r">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight tracking-tight">
                        {process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-primary-500 font-bold">Premium Edition</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative group block"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl border border-primary-500/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className={cn(
                                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                                isActive ? "text-primary-600 dark:text-primary-400 font-semibold" : "text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/5"
                            )}>
                                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-primary-500")} />
                                <span className="text-sm">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-auto"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </motion.div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
                <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-accent-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                    <p className="text-xs font-bold text-primary-600 mb-1">Status: Operational</p>
                    <p className="text-[10px] text-gray-400">Tower Pulse Ecosystem</p>
                </div>

                <div className="px-2 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/60 leading-relaxed">
                        Vibe coded by <br />
                        <span className="text-primary-600 dark:text-primary-400">Nishant Modi</span>
                    </p>
                </div>
            </div>
        </aside>
    )
}
