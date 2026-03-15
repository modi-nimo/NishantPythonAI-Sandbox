"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Send,
    Info,
    Droplets,
    Zap,
    Shield,
    Key,
    HelpCircle
} from "lucide-react"
import { submitComplaint } from "@/lib/actions/complaints"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"

const categories = [
    { id: "Water", icon: Droplets, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
    { id: "Electricity", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    { id: "Security", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
    { id: "Lift", icon: Key, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { id: "Other", icon: HelpCircle, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
]

export function ComplaintForm({
    onSuccess,
    embedded = false
}: {
    onSuccess?: () => void
    embedded?: boolean
}) {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
    const [selectedCategory, setSelectedCategory] = useState("")

    async function handleSubmit(formData: FormData) {
        setStatus("submitting")
        try {
            await submitComplaint(formData)
            setStatus("success")
        } catch (error) {
            console.error(error)
            setStatus("error")
        }
    }

    if (status === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                className={cn(
                    "text-center max-w-xl mx-auto py-10",
                    !embedded && "glass-card p-12 rounded-[3.5rem]"
                )}
            >
                <div className="relative inline-block mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="h-28 w-28 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20"
                    >
                        <CheckCircle2 className="h-14 w-14" />
                    </motion.div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-2xl -z-10"
                    />
                </div>

                <h2 className="text-4xl font-black font-outfit mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white">
                    Transmission Success
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-base leading-relaxed max-w-sm mx-auto font-medium">
                    Your report has been encrypted and broadcasted to the tower committee.
                </p>

                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                    <Button
                        onClick={() => {
                            if (onSuccess) {
                                onSuccess()
                                window.location.reload()
                            } else {
                                window.location.reload()
                            }
                        }}
                        className="rounded-[1.5rem] h-16 font-black text-sm uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-700 shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Return to Hub <ArrowRight className="ml-3 h-4 w-4" />
                    </Button>
                    {!embedded && (
                        <Button variant="ghost" onClick={() => setStatus("idle")} className="rounded-2xl h-12 text-gray-400 font-bold hover:text-primary-600">
                            File another one
                        </Button>
                    )}
                </div>
            </motion.div>
        )
    }

    return (
        <form action={handleSubmit} className={cn("mx-auto space-y-6", !embedded && "max-w-2xl")}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "space-y-6",
                    !embedded && "glass-card p-10 md:p-12 rounded-[4rem]"
                )}
            >
                {!embedded && (
                    <div className="flex items-center gap-6 mb-12">
                        <div className="h-16 w-16 rounded-[1.75rem] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-2xl shadow-primary-500/30">
                            <Send className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter leading-none mb-2">Service Request</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase">Encrypted Channel</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Flat No Input */}
                        <div className="space-y-3">
                            <Label htmlFor="flat_no" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600/80 ml-2">Assigned Unit</Label>
                            <div className="relative group">
                                <Input
                                    id="flat_no"
                                    name="flat_no"
                                    required
                                    placeholder="EX: C-804"
                                    className="h-14 rounded-[1.25rem] border-gray-100 bg-gray-50 dark:bg-black/40 dark:border-white/10 px-6 text-sm font-black focus:ring-primary-500 shadow-sm placeholder:text-gray-400 dark:text-white transition-all group-hover:bg-gray-100 dark:group-hover:bg-black/60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600/80 ml-2">Select Sector</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] border transition-all duration-500 gap-2 group overflow-hidden shadow-sm",
                                        selectedCategory === cat.id
                                            ? "border-transparent text-white scale-105 shadow-2xl"
                                            : "bg-gray-50 dark:bg-black/30 border-gray-100 dark:border-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-black/50 hover:scale-[1.02]"
                                    )}
                                >
                                    {selectedCategory === cat.id && (
                                        <motion.div
                                            layoutId="cat-bg"
                                            className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary-600 dark:to-primary-800 -z-10"
                                        />
                                    )}
                                    <cat.icon className={cn("h-5 w-5 transition-all duration-500",
                                        selectedCategory === cat.id ? "text-white scale-110 rotate-12" : cat.color,
                                        "group-hover:scale-110"
                                    )} />
                                    <span className="text-[9px] font-black tracking-tight uppercase">{cat.id}</span>
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="category" value={selectedCategory} required />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600/80 ml-2">Incident Narrative</Label>
                        <div className="relative group">
                            <Textarea
                                id="description"
                                name="description"
                                required
                                rows={3}
                                placeholder="Describe the situation in detail..."
                                className="rounded-[1.5rem] border-gray-100 bg-gray-50 dark:bg-black/40 dark:border-white/10 p-6 text-sm font-medium focus:ring-primary-500 resize-none min-h-[100px] shadow-sm placeholder:text-gray-400 dark:text-white transition-all group-hover:bg-gray-100 dark:group-hover:bg-black/60"
                            />
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={status === "submitting" || !selectedCategory}
                            className={cn(
                                "w-full h-16 rounded-[1.25rem] font-black text-sm transition-all duration-500 shadow-xl disabled:opacity-50 group tracking-[0.3em] uppercase overflow-hidden relative",
                                status === "submitting"
                                    ? "bg-slate-700"
                                    : "bg-slate-900 dark:bg-primary-600 text-white hover:scale-[1.02] active:scale-95"
                            )}
                        >
                            {status === "submitting" ? (
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                    <span>Authorizing...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="relative z-10">Broadcast Request</span>
                                    <ArrowRight className="ml-4 h-4 w-4 transition-transform group-hover:translate-x-2 relative z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                </>
                            )}
                        </Button>
                        <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
                            <div className="h-px w-8 bg-gray-400" />
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.4em]">
                                Direct Protocol
                            </p>
                            <div className="h-px w-8 bg-gray-400" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {status === "error" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-4 text-rose-500 font-black text-[11px] uppercase tracking-widest backdrop-blur-md shadow-xl"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    Security Protocol Error: Failed to transmit data. Please verify connection.
                </motion.div>
            )}
        </form>
    )
}
