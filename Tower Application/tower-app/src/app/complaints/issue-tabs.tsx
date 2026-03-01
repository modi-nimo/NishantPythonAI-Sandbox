"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Activity,
    PlusCircle,
    History,
    MessageSquare
} from "lucide-react"
import { cn } from "@/utils/cn"

interface IssueTabsProps {
    feed: React.ReactNode
    form: React.ReactNode
    count: number
}

export function IssueTabs({ feed, form, count }: IssueTabsProps) {
    const [activeTab, setActiveTab] = useState<"feed" | "report">("feed")

    const tabs = [
        { id: "feed", label: "Live Feed", icon: Activity, badge: count },
        { id: "report", label: "New Report", icon: PlusCircle },
    ]

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-[2rem] border border-gray-200 dark:border-white/5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "relative flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500",
                                    isActive ? "text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIssueTab"
                                        className="absolute inset-0 bg-slate-900 rounded-[1.5rem] shadow-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <div className="relative z-10 flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span className="uppercase tracking-widest text-[10px]">{tab.label}</span>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className={cn(
                                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black",
                                            isActive ? "bg-primary-500 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-400"
                                        )}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-2xl">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Real-time Sync</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    {activeTab === "feed" ? feed : form}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
