"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Home,
    MessageCircle,
    ShieldCheck,
    Menu,
    X,
    Bell,
    Calendar,
    FileText
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/cn"

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Issues Center", href: "/complaints", icon: MessageCircle },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Notices", href: "/notices", icon: Bell },
    { name: "Admin", href: "/admin", icon: ShieldCheck },
]

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="lg:hidden">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 glass z-[60] flex items-center justify-between px-6 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black font-outfit text-sm uppercase tracking-tighter">
                        {process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"}
                    </span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5"
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Fullscreen Overlay Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[55] bg-white dark:bg-slate-900 pt-24 px-8"
                    >
                        <nav className="space-y-4">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-3xl border transition-all",
                                            isActive
                                                ? "bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/20"
                                                : "glass-card border-transparent text-gray-500 font-bold"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon className="h-6 w-6" />
                                            <span className="text-xl font-black font-outfit uppercase tracking-tight">{item.name}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute bottom-10 left-8 right-8 space-y-6">
                            <div className="glass-card p-6 rounded-[2rem] bg-slate-900 text-white">
                                <p className="text-xs font-black text-primary-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-lg font-bold">Systems Operational</p>
                            </div>

                            <div className="px-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/60 leading-relaxed">
                                    Coded by <br />
                                    <span className="text-primary-600 dark:text-primary-400 text-sm">Nishant Modi</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
