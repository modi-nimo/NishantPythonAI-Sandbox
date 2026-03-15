"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/utils/cn"

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    subtitle?: string
}

export function Drawer({ isOpen, onClose, children, title, subtitle }: DrawerProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        if (isOpen) {
            document.body.style.overflow = "hidden"
            window.addEventListener("keydown", handleEscape)
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
            window.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "relative w-full max-w-xl h-full shadow-2xl flex flex-col",
                            "bg-white dark:bg-slate-950 border-l border-gray-100 dark:border-white/5"
                        )}
                    >
                        {/* Header */}
                        <div className="px-8 py-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {title || "Command Panel"}
                                </h2>
                                {subtitle && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                                        <p className="text-[10px] text-primary-600 font-black tracking-[0.4em] uppercase opacity-60">
                                            {subtitle}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-primary-600 hover:text-white transition-all duration-300 group shadow-sm active:scale-95"
                            >
                                <X className="h-5 w-5 transition-transform group-hover:rotate-90 duration-500" />
                            </button>
                        </div>

                        {/* Body - Optimized Scroll */}
                        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
