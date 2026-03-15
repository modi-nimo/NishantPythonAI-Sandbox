import { createClient } from "@/utils/supabase/server"
import { motion } from "framer-motion"
import { Bell, Clock, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NoticeCard } from "./notice-card"

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
                        Stay informed with the latest updates, circulars, and community announcements from the {process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"} committee.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notices?.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} />
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
