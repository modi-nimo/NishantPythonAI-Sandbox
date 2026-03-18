"use client"

import { useState } from "react"
import { Bell, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "../../utils/cn"
import { createNotice } from "./actions"
import { DeleteNoticeButton } from "./delete-notice-button"
import { transformGDriveUrl } from "@/utils/media"

export function NoticeManager({ notices }: { notices: any[] }) {
    return (
        <div className="grid lg:grid-cols-12 gap-10">
            {/* Creator */}
            <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit">
                <div className="glass-card p-10 rounded-[3rem] space-y-8 shadow-2xl">
                    <div>
                        <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter text-slate-900 dark:text-white">Draft Update</h2>
                        <p className="text-xs text-gray-500 font-bold mt-1 tracking-widest uppercase">Global Broadcast</p>
                    </div>

                    <form action={createNotice} className="space-y-6">
                        <div className="space-y-2">
                            <input
                                name="title"
                                required
                                placeholder="Notice Title"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:ring-1 focus:ring-accent-500 p-4 rounded-2xl text-sm font-bold outline-none text-slate-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <textarea
                                name="content"
                                required
                                rows={4}
                                placeholder="Main message content..."
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:ring-1 focus:ring-accent-500 p-4 rounded-2xl text-sm font-medium outline-none resize-none text-slate-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <input
                                name="image_url"
                                placeholder="Image URL (Optional)"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 focus:ring-1 focus:ring-accent-500 p-4 rounded-2xl text-sm font-bold outline-none text-slate-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select name="priority" className="flex-1 bg-gray-50 dark:bg-white text-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none border border-gray-200 dark:border-white/10">
                                <option value="normal">Normal Priority</option>
                                <option value="urgent">Urgent + Telegram</option>
                            </select>
                            <Button type="submit" className="h-14 w-14 rounded-2xl bg-accent-500 hover:bg-accent-600 shadow-xl shadow-accent-500/20 transition-all active:scale-95">
                                <Plus className="h-6 w-6 text-white" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Active Notices */}
            <div className="lg:col-span-8 space-y-6">
                <h2 className="text-xl font-black font-outfit uppercase tracking-tight flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary-500" /> Currently Published
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {notices.map(n => (
                        <div key={n.id} className="glass-card p-6 rounded-[2rem] flex flex-col justify-between group overflow-hidden">
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <Badge className={cn(
                                        "rounded-md text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                                        n.priority === 'urgent' ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        {n.priority}
                                    </Badge>
                                    <DeleteNoticeButton id={n.id} />
                                </div>
                                {n.image_url && (
                                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-gray-100 dark:border-white/5">
                                        <img src={transformGDriveUrl(n.image_url) || ""} alt={n.title} referrerPolicy="no-referrer" className="object-cover w-full h-full" />
                                    </div>
                                )}
                                <h4 className="font-bold text-lg leading-tight uppercase tracking-tight group-hover:text-primary-600 transition-colors">{n.title}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-semibold">{n.content}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {notices.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-40">
                            <p className="text-sm font-bold uppercase tracking-widest">No active notices</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
