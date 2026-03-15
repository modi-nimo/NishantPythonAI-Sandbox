"use client"

import { useState } from "react"
import {
    Clock,
    MessageSquare,
    Plus,
    CheckCircle2,
    TrendingUp,
    ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import { updateComplaintStatus, addComplaintComment } from "./actions"
import { DeleteComplaintButton } from "./delete-complaint-button"

export function ComplaintsManager({ complaints }: { complaints: any[] }) {
    const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'open').length,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">Management Console</h2>
                <Badge className="bg-primary-600 text-white rounded-lg h-8 px-3 font-bold">{stats.total} Total Issues</Badge>
            </div>

            <div className="space-y-4">
                {complaints.map((c) => (
                    <div key={c.id} className={cn(
                        "glass-card p-6 md:p-8 rounded-[2.5rem] transition-all duration-500",
                        c.status === 'resolved' ? "opacity-60 bg-gray-50/50" : "bg-white dark:bg-white/5 shadow-2xl shadow-primary-500/5"
                    )}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Badge className={cn(
                                        "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                                        c.status === 'open' ? 'bg-red-500 text-white' :
                                            c.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
                                    )}>
                                        {c.status}
                                    </Badge>
                                    <span className="text-xl font-black font-outfit uppercase">Flat {c.flat_no}</span>
                                </div>
                                <p className="text-lg font-bold text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">{c.description}</p>
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Submitted {new Date(c.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {c.status === 'open' && (
                                    <Button
                                        onClick={() => updateComplaintStatus(c.id, 'in-progress')}
                                        size="sm"
                                        className="rounded-xl h-10 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    >
                                        Acknowledge
                                    </Button>
                                )}
                                {c.status !== 'resolved' && (
                                    <Button
                                        onClick={() => updateComplaintStatus(c.id, 'resolved')}
                                        size="sm"
                                        className="rounded-xl h-10 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                    >
                                        Resolve
                                    </Button>
                                )}
                                {c.status === 'resolved' && (
                                    <Button
                                        onClick={() => updateComplaintStatus(c.id, 'open')}
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl h-10 font-bold"
                                    >
                                        Re-open
                                    </Button>
                                )}
                                <DeleteComplaintButton id={c.id} />
                            </div>
                        </div>

                        {/* Discussion Thread */}
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" /> Internal Timeline
                                </h4>
                            </div>
                            <div className="space-y-3 pl-4 border-l-2 border-gray-50 dark:border-white/5">
                                {c.comments?.map((comment: any) => (
                                    <div key={comment.id} className="group relative">
                                        <p className="text-sm font-medium text-gray-500 leading-snug">{comment.message}</p>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                <CommentForm complaintId={c.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CommentForm({ complaintId }: { complaintId: string }) {
    const [message, setMessage] = useState("")
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message || isPending) return
        setIsPending(true)
        try {
            await addComplaintComment(complaintId, message)
            setMessage("")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Post an update..."
                className="flex-1 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 focus:ring-1 focus:ring-primary-500 px-4 py-2 rounded-xl text-sm outline-none transition-all text-slate-900 dark:text-white placeholder:text-gray-400"
            />
            <Button
                type="submit"
                disabled={isPending}
                variant="ghost"
                className="rounded-xl h-9 w-9 p-0 hover:bg-primary-500 hover:text-white transition-all"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </form>
    )
}
