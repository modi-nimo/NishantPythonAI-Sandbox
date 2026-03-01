"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Inbox,
    BellRing,
    BarChart3,
    ShieldAlert,
} from "lucide-react"
import { cn } from "@/utils/cn"

interface Tab {
    id: string
    label: string
    icon: any
}

const tabs: Tab[] = [
    { id: "overview", label: "Insights", icon: BarChart3 },
    { id: "complaints", label: "Complaints", icon: Inbox },
    { id: "notices", label: "Notices", icon: BellRing },
    { id: "security", label: "Security", icon: ShieldAlert },
]

export function AdminTabs({
    complaintsCount,
    urgentCount,
    overview,
    complaintsTab,
    noticesTab,
    securityTab
}: {
    complaintsCount: number,
    urgentCount: number,
    overview: React.ReactNode,
    complaintsTab: React.ReactNode,
    noticesTab: React.ReactNode,
    securityTab: React.ReactNode
}) {
    const [activeTab, setActiveTab] = useState("overview")

    const tabContent: Record<string, React.ReactNode> = {
        overview,
        complaints: complaintsTab,
        notices: noticesTab,
        security: securityTab
    }

    return (
        <div className="space-y-8">
            {/* Horizontal Tabs Shell */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-[2rem] border border-gray-200 dark:border-white/5 w-fit">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-500",
                                isActive ? "text-white" : "text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-admin-tab"
                                    className="absolute inset-0 bg-slate-900 rounded-full shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className="relative z-10 h-4 w-4" />
                            <span className="relative z-10">{tab.label}</span>

                            {tab.id === 'complaints' && complaintsCount > 0 && (
                                <span className={cn(
                                    "relative z-10 ml-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px]",
                                    isActive ? "bg-white text-slate-900" : "bg-red-500 text-white"
                                )}>
                                    {complaintsCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Content Area with Slide Animation */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {tabContent[activeTab]}
            </motion.div>
        </div>
    )
}
