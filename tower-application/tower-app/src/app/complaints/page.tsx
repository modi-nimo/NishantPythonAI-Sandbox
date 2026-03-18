import { createClient } from "../../utils/supabase/server"
import { Badge } from "../../components/ui/badge"
import {
    Inbox,
    MessageSquare,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Zap,
    Droplets,
    Shield,
    Key,
    HelpCircle
} from "lucide-react"
import { cn } from "../../utils/cn"
import { IssueTabs } from "./issue-tabs"
import { ComplaintForm } from "../../components/issues/complaint-form"

const categoryIcons: Record<string, any> = {
    "Water": Droplets,
    "Electricity": Zap,
    "Security": Shield,
    "Lift": Key,
    "Other": HelpCircle,
}

export default async function PublicComplaintsPage() {
    const supabase = await createClient()

    const { data: complaints, error } = await supabase
        .from("complaints")
        .select("*, comments(*)")
        .order("created_at", { ascending: false })

    const activeCount = complaints?.filter(c => c.status !== 'resolved').length || 0

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <Badge className="bg-primary-600/10 text-primary-600 border-primary-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Resident Voice
                    </Badge>
                    <h1 className="text-5xl lg:text-7xl font-black font-outfit leading-none tracking-tight">
                        Issues <span className="text-primary-600 text-glow">Center.</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-medium max-w-xl">
                        A unified dashboard for reporting new concerns and tracking real-time resolution progress across the tower.
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-3xl font-black font-outfit leading-none">{(complaints?.length || 0)}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Total Filed</p>
                    </div>
                    <div className="h-12 w-px bg-gray-100 dark:bg-white/5" />
                    <div className="text-right">
                        <p className="text-3xl font-black font-outfit leading-none text-primary-600">{(complaints?.filter(c => c.status === 'resolved').length || 0)}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Resolved</p>
                    </div>
                </div>
            </div>

            <IssueTabs
                count={activeCount}
                form={<ComplaintForm />}
                feed={
                    <div className="grid gap-6">
                        {complaints?.map((complaint) => {
                            const Icon = categoryIcons[complaint.category] || HelpCircle
                            return (
                                <div key={complaint.id} className={cn(
                                    "glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 transition-all duration-500",
                                    complaint.status === 'resolved' ? "opacity-60 grayscale-[0.5]" : "hover:shadow-2xl hover:shadow-primary-500/5 group"
                                )}>
                                    {/* Status & Icon */}
                                    <div className="flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-start gap-4 md:w-32">
                                        <div className={cn(
                                            "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-xl",
                                            complaint.status === 'open' ? "bg-red-500/10 text-red-500 shadow-red-500/5" :
                                                complaint.status === 'in-progress' ? "bg-blue-500/10 text-blue-500 shadow-blue-500/5" : "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5"
                                        )}>
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <Badge className={cn(
                                            "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg",
                                            complaint.status === 'open' ? 'bg-red-500 shadow-red-500/20' :
                                                complaint.status === 'in-progress' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
                                        )}>
                                            {complaint.status}
                                        </Badge>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> Flat {complaint.flat_no}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(complaint.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-black font-outfit uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                                                {complaint.category} Issue
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-2 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                                {complaint.description}
                                            </p>
                                        </div>

                                        {/* Updates */}
                                        {complaint.comments?.length > 0 && (
                                            <div className="mt-6 p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-4">
                                                <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare className="h-3 w-3" /> Committee Feed
                                                </h4>
                                                <div className="space-y-4">
                                                    {complaint.comments.map((comment: any) => (
                                                        <div key={comment.id} className="relative pl-4 border-l-2 border-primary-500/20">
                                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{comment.message}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                                                {new Date(comment.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action/Verification */}
                                    <div className="hidden lg:flex flex-col justify-end">
                                        <div className="h-10 w-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-4 w-4 text-primary-500" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {(!complaints || complaints.length === 0) && !error && (
                            <div className="text-center py-40 glass-card rounded-[4rem] opacity-40">
                                <Inbox className="h-12 w-12 mx-auto mb-4" />
                                <p className="text-sm font-black uppercase tracking-[0.2em]">Operational Excellence</p>
                                <p className="text-xs font-bold text-gray-400 mt-2">Zero reported issues for your tower</p>
                            </div>
                        )}
                    </div>
                }
            />
        </div>
    )
}
