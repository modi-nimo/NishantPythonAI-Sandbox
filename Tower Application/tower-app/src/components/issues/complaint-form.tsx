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
    { id: "Water", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "Electricity", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { id: "Security", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "Lift", icon: Key, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "Other", icon: HelpCircle, color: "text-gray-500", bg: "bg-gray-500/10" },
]

export function ComplaintForm() {
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 rounded-[3rem] text-center max-w-xl mx-auto"
            >
                <div className="h-24 w-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black font-outfit mb-4">Complaint Received!</h2>
                <p className="text-gray-500 mb-10 text-lg leading-relaxed">
                    Your issue has been broadcasted to the committee and registered in the digital vault. We are on it.
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={() => window.location.reload()} className="rounded-2xl h-14 font-bold bg-primary-600 hover:bg-primary-700">
                        View Live Feed <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setStatus("idle")} className="rounded-2xl h-12 text-gray-400 font-bold">
                        File another one
                    </Button>
                </div>
            </motion.div>
        )
    }

    return (
        <form action={handleSubmit} className="max-w-2xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-10 rounded-[3rem]"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                        <Send className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black font-outfit uppercase tracking-tight">Issue Reporter</h1>
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                            <Info className="h-3 w-3" /> DIRECT TO COMMITTEE
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Flat No Input */}
                    <div className="space-y-4">
                        <Label htmlFor="flat_no" className="text-xs font-black uppercase tracking-widest text-primary-600 ml-1">Location Details</Label>
                        <Input
                            id="flat_no"
                            name="flat_no"
                            required
                            placeholder="Flat Number (e.g. C-804)"
                            className="h-16 rounded-2xl border-gray-100 bg-gray-50/50 dark:bg-white/5 dark:border-white/5 px-6 text-lg font-bold focus:ring-primary-500"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary-600 ml-1">Select Category</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2",
                                        selectedCategory === cat.id
                                            ? "bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/20 scale-105"
                                            : "glass-card border-transparent text-gray-400 font-bold"
                                    )}
                                >
                                    <cat.icon className={cn("h-6 w-6", selectedCategory === cat.id ? "text-white" : cat.color)} />
                                    <span className="text-[10px] uppercase tracking-tighter">{cat.id}</span>
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="category" value={selectedCategory} required />
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-primary-600 ml-1">Brief Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            required
                            rows={4}
                            placeholder="Tell us what's wrong..."
                            className="rounded-3xl border-gray-100 bg-gray-50/50 dark:bg-white/5 dark:border-white/5 p-6 text-gray-600 font-medium focus:ring-primary-500 resize-none"
                        />
                    </div>

                    {/* Submit Section */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={status === "submitting" || !selectedCategory}
                            className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 group"
                        >
                            {status === "submitting" ? (
                                "Initializing..."
                            ) : (
                                <>
                                    Broadcast Complaint
                                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest opacity-60">
                            Committee members will be notified instantly via Telegram
                        </p>
                    </div>
                </div>
            </motion.div>

            {status === "error" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-bold text-sm"
                >
                    <AlertCircle className="h-5 w-5" />
                    Failed to submit. Please check your connection.
                </motion.div>
            )}
        </form>
    )
}
