import { createClient } from "@/utils/supabase/server"
import { motion } from "framer-motion"
import { Bell, Clock, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/cn"

export default async function NoticesPage() {
    const supabase = await createClient()
    const { data: notices } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 lg:p-20 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-500/10 to-transparent" />
                <div className="relative z-10 space-y-6 max-w-2xl">
                    <Badge className="bg-primary-500/20 text-primary-400 border-primary-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                        Official Broadcasts
                    </Badge>
                    <h1 className="text-5xl lg:text-7xl font-black font-outfit leading-none tracking-tight">
                        Notice <span className="text-primary-500">Board.</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-medium leading-relaxed">
                        Stay informed with the latest updates, circulars, and community announcements from the Tower Pulse committee.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notices?.map((notice, i) => (
                    <div
                        key={notice.id}
                        className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <Badge className={cn(
                                    "rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                    notice.priority === 'urgent' ? "bg-red-500 text-white animate-pulse" : "bg-primary-600/10 text-primary-600"
                                )}>
                                    {notice.priority}
                                </Badge>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> {new Date(notice.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black font-outfit uppercase tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
                                {notice.title}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-6">
                                {notice.content}
                            </p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Circular</span>
                            </div>
                            <ShieldCheck className="h-4 w-4 text-primary-500/30" />
                        </div>
                    </div>
                ))}

                {(!notices || notices.length === 0) && (
                    <div className="col-span-full py-40 text-center glass-card rounded-[3rem] opacity-40">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-black uppercase tracking-widest">No notices published</p>
                    </div>
                )}
            </div>
        </div>
    )
}
