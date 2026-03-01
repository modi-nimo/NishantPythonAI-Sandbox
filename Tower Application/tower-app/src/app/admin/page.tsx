import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getAdminSession } from "@/utils/auth-session"
import {
    ShieldCheck,
    Inbox,
    TrendingUp,
    CheckCircle2,
    LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminTabs } from "./admin-tabs"
import { adminLogout } from "./actions"
import { ComplaintsManager } from "./complaints-manager"
import { NoticeManager } from "./notice-manager"

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Verify admin session
    const session = await getAdminSession()
    if (!session) redirect("/admin/login")

    // Parallel data fetching
    const [complaintsRes, noticesRes] = await Promise.all([
        supabase.from("complaints").select("*, comments(*)").order("created_at", { ascending: false }),
        supabase.from("notices").select("*").order("created_at", { ascending: false })
    ])

    const complaints = complaintsRes.data || []
    const notices = noticesRes.data || []

    const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'open').length,
        inProgress: complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    }

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Badge className="mb-4 bg-primary-600/10 text-primary-600 border-primary-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Administrative Authority
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black font-outfit leading-tight tracking-tight">
                        Committee <span className="text-primary-600">Suite.</span>
                    </h1>
                    <p className="text-gray-400 font-medium tracking-tight">
                        Operations Center for {process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"} Ecosystem
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <form action={adminLogout}>
                        <Button type="submit" variant="outline" className="rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-12 px-6 font-bold transition-all">
                            <LogOut className="mr-2 h-4 w-4" /> Secure Logout
                        </Button>
                    </form>
                </div>
            </header>

            <AdminTabs
                complaintsCount={stats.open + stats.inProgress}
                urgentCount={notices.filter(n => n.priority === 'urgent').length}
                overview={
                    <div className="space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "High Priority", val: stats.open, icon: ShieldCheck, color: "text-red-500", bg: "bg-red-500/10" },
                                { label: "Active Jobs", val: stats.inProgress, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
                                { label: "Total Resolved", val: stats.resolved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                { label: "Total Volume", val: stats.total, icon: Inbox, color: "text-gray-500", bg: "bg-gray-500/10" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-6 rounded-[2rem] space-y-4 group">
                                    <div className={stat.bg + " " + stat.color + " h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black font-outfit">{stat.val}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Placeholder for more overview content if needed */}
                        <div className="p-20 text-center glass-card rounded-[3rem] opacity-40">
                            <p className="text-sm font-bold uppercase tracking-widest">Select a tab for detailed management</p>
                        </div>
                    </div>
                }
                complaintsTab={<ComplaintsManager complaints={complaints} />}
                noticesTab={<NoticeManager notices={notices} />}
                securityTab={
                    <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
                        <div className="h-20 w-20 bg-primary-600/10 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter leading-none">Security Center</h2>
                        <p className="text-gray-400 font-medium">Authentication sessions and committee credentials are encrypted via bcrypt (v3.0). All actions are logged and traceable.</p>
                        <div className="grid grid-cols-2 gap-4 pt-10">
                            <div className="glass-card p-6 rounded-3xl">
                                <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-2">Auth Provider</p>
                                <p className="text-lg font-bold">Internal BCrypt</p>
                            </div>
                            <div className="glass-card p-6 rounded-3xl">
                                <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-2">Audit Logs</p>
                                <p className="text-lg font-bold">Enabled</p>
                            </div>
                        </div>
                    </div>
                }
            />
        </div>
    )
}
