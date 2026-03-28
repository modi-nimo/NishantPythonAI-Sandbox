"use client"

import { useState } from "react"
import { Clock, ExternalLink, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/utils/cn"
import { transformGDriveUrl } from "@/utils/media"

interface Notice {
    id: string
    title: string
    content: string
    priority: "normal" | "urgent"
    created_at: string
    image_url?: string | null
}

const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

function renderInlineContent(text: string) {
    const parts = text.split(urlPattern)

    return parts.map((part, index) => {
        const isUrl = urlPattern.test(part)
        urlPattern.lastIndex = 0

        if (!isUrl) {
            return <span key={`${part}-${index}`}>{part}</span>
        }

        const href = part.startsWith("http") ? part : `https://${part}`

        return (
            <a
                key={`${part}-${index}`}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary-600 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-700"
                onClick={(event) => event.stopPropagation()}
            >
                {part}
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        )
    })
}

function renderNoticeContent(content: string) {
    return content
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, index) => {
            const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
            const isList = lines.length > 1 && lines.every((line) => /^([•\-*]|\d+\.)\s+/.test(line))

            if (isList) {
                return (
                    <ul key={`list-${index}`} className="space-y-3 pl-6 text-base leading-8 text-slate-700 dark:text-gray-300 list-disc marker:text-primary-500">
                        {lines.map((line, lineIndex) => (
                            <li key={`item-${lineIndex}`}>
                                {renderInlineContent(line.replace(/^([•\-*]|\d+\.)\s+/, ""))}
                            </li>
                        ))}
                    </ul>
                )
            }

            return (
                <p key={`paragraph-${index}`} className="text-lg leading-9 text-slate-700 dark:text-gray-300">
                    {lines.map((line, lineIndex) => (
                        <span key={`line-${lineIndex}`}>
                            {renderInlineContent(line)}
                            {lineIndex < lines.length - 1 && <br />}
                        </span>
                    ))}
                </p>
            )
        })
}

export function NoticeCard({ notice }: { notice: Notice }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="glass-card w-full p-8 rounded-[2.5rem] flex flex-col justify-between text-left group hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
                aria-label={`Open notice: ${notice.title}`}
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
                    {notice.image_url && (
                        <div className="relative aspect-video rounded-[1.5rem] overflow-hidden my-4 border border-gray-100 dark:border-white/5 shadow-inner">
                            <img
                                src={transformGDriveUrl(notice.image_url) || ""}
                                alt={notice.title}
                                referrerPolicy="no-referrer"
                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-6 whitespace-pre-line">
                        {notice.content}
                    </p>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Circular</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-500/60">
                        <span>Open Notice</span>
                        <ShieldCheck className="h-4 w-4 text-primary-500/30" />
                    </div>
                </div>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={notice.title}
                maxWidth="4xl"
            >
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <Badge className={cn(
                            "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest",
                            notice.priority === 'urgent' ? "bg-red-500 text-white animate-pulse" : "bg-primary-600/10 text-primary-600"
                        )}>
                            {notice.priority} Priority
                        </Badge>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                            <Clock className="h-4 w-4" /> Published {new Date(notice.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {notice.image_url && (
                        <div className="relative w-full rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                            <img
                                src={transformGDriveUrl(notice.image_url) || ""}
                                alt={notice.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-auto max-h-[60vh] object-contain bg-slate-100 dark:bg-slate-900/50"
                            />
                        </div>
                    )}

                    <div className="max-w-none space-y-6 font-medium">
                        {renderNoticeContent(notice.content)}
                    </div>
                </div>
            </Modal>
        </>
    )
}
