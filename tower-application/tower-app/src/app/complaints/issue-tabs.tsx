"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Activity,
    PlusCircle,
    History,
    MessageSquare
} from "lucide-react"
import { cn } from "@/utils/cn"

import { Drawer } from "@/components/ui/drawer"

interface IssueTabsProps {
    feed: React.ReactNode
    form: React.ReactNode
    count: number
}

export function IssueTabs({ feed, form, count }: IssueTabsProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 p-1.5 rounded-[2rem] border border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] bg-slate-900 text-white shadow-xl">
                        <Activity className="h-4 w-4 text-primary-400" />
                        <span className="uppercase tracking-widest text-[10px] font-black">Live Feedback Feed</span>
                        {count > 0 && (
                            <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black bg-primary-500 text-white ml-2">
                                {count}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/10 transition-all font-bold group"
                    >
                        <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                        <span className="uppercase tracking-widest text-[10px]">New Report</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-2xl">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sync Active</span>
                </div>
            </div>

            <div className="min-h-[400px]">
                {feed}
            </div>

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Service Request"
                subtitle="Neural Transmission Secured"
            >
                <div className="py-2">
                    {React.cloneElement(form as React.ReactElement, {
                        onSuccess: () => setIsDrawerOpen(false),
                        embedded: true
                    } as any)}
                </div>
            </Drawer>
        </div>
    )
}
