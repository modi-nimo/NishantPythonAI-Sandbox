"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "../../utils/cn"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl"
}

export function Modal({ isOpen, onClose, children, title, maxWidth = "2xl" }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

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

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "4xl": "max-w-4xl",
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className={cn(
                            "relative w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[4rem] overflow-hidden max-h-[92vh] flex flex-col transition-all duration-700",
                            "bg-white/60 dark:bg-slate-900/40 backdrop-blur-[40px] border border-white/30 dark:border-white/10",
                            maxWidthClasses[maxWidth]
                        )}
                        ref={modalRef}
                    >
                        {/* Decorative Gradient Glows */}
                        <div className="absolute top-0 left-1/4 h-32 w-1/2 bg-primary-500/10 blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-0 right-1/4 h-32 w-1/2 bg-accent-500/10 blur-[120px] pointer-events-none" />

                        {/* Header */}
                        <div className="px-10 py-10 flex items-center justify-between relative z-10">
                            <div>
                                <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {title || "Modal Title"}
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                                    <p className="text-[10px] text-primary-600 font-black tracking-[0.4em] uppercase opacity-60">
                                        Neural Transmission Secured
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-14 w-14 flex items-center justify-center rounded-[1.75rem] bg-gray-100/50 dark:bg-white/5 hover:bg-slate-900 dark:hover:bg-primary-600 hover:text-white transition-all duration-300 group shadow-xl active:scale-95"
                            >
                                <X className="h-6 w-6 transition-transform group-hover:rotate-90 duration-500" />
                            </button>
                        </div>

                        {/* Body - Optimized Scroll */}
                        <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar relative z-10">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
