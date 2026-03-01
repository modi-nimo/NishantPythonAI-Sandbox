"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from "lucide-react"
import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStatus } from "react-dom"

function LoginButton() {
    const { pending } = useFormStatus()
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 group"
        >
            {pending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
                <>
                    Enter Secure Portal
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
            )}
        </Button>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden">
                    {/* Decorative Security Ring */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary-600/5 rounded-full blur-2xl" />

                    <div className="text-center mb-10">
                        <div className="h-20 w-20 bg-primary-600/10 text-primary-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter leading-none mb-2">Committee <span className="text-primary-600">Gate.</span></h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest opacity-60">Identity Verification Required</p>
                    </div>

                    <form action={login} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 ml-2">Secure Identifier</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="committee@tower.com"
                                        className="h-16 pl-14 rounded-2xl border-gray-100 bg-gray-50/50 dark:bg-white/5 dark:border-white/5 text-base font-bold outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 ml-2">Access Token</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="h-16 pl-14 rounded-2xl border-gray-100 bg-gray-50/50 dark:bg-white/5 dark:border-white/5 text-base font-bold outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <LoginButton />
                            <p className="text-center text-[9px] text-gray-400 mt-6 font-black uppercase tracking-widest leading-loose">
                                Protected by military-grade BCrypt encryption. <br />
                                Unauthorized access is strictly logged.
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
