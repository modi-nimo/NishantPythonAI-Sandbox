import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Inbox, BellRing, CheckCircle2, MessageSquare, History } from "lucide-react"
import { getAdminSession, clearAdminSession } from "@/utils/auth-session"
import { updateComplaintStatus, addComplaintComment } from "./actions"
import { DeleteComplaintButton } from "./delete-complaint-button"
import { DeleteNoticeButton } from "./delete-notice-button"

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Verify custom admin session
    const session = await getAdminSession()
    if (!session) {
        redirect("/admin/login")
    }

    // Fetch data: Complaints with their comments
    const { data: complaints } = await supabase
        .from("complaints")
        .select(`
            *,
            comments(*)
        `)
        .order("created_at", { ascending: false })

    const { data: notices } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <History className="h-5 w-5 text-blue-600" />
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Committee Dashboard</h1>
                    </div>
                    <p className="text-gray-500">Managing Sensorium Elation Tower Operations</p>
                </div>
                <form action={async () => {
                    "use server"
                    await clearAdminSession()
                    redirect("/admin/login")
                }}>
                    <Button type="submit" variant="ghost" className="text-gray-500 hover:text-red-600 gap-2">
                        <LogOut className="h-4 w-4" /> <span>Logout</span>
                    </Button>
                </form>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Complaints (Main Focus) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Inbox className="h-5 w-5" /> Recent Complaints
                        </h2>
                        <Badge variant="default" className="px-3">{complaints?.length || 0} Total</Badge>
                    </div>

                    {complaints?.map((c) => (
                        <Card key={c.id} className={c.status === 'resolved' ? 'opacity-75 grayscale-[0.5]' : ''}>
                            <CardHeader className="pb-3 border-b bg-gray-50/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={
                                                c.status === 'open' ? 'warning' :
                                                    c.status === 'in-progress' ? 'info' : 'success'
                                            }>
                                                {c.status.toUpperCase()}
                                            </Badge>
                                            <span className="font-bold text-lg text-gray-900">Flat {c.flat_no}</span>
                                        </div>
                                        <p className="text-sm font-medium text-blue-600">{c.category}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(c.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{c.description}</p>

                                {/* Comments Section */}
                                {c.comments?.length > 0 && (
                                    <div className="bg-blue-50/30 rounded-lg p-3 space-y-2 border border-blue-50">
                                        <h5 className="text-xs font-bold text-blue-400 uppercase tracking-tighter flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" /> Public Updates (Visible to User)
                                        </h5>
                                        {c.comments.map((comment: any) => (
                                            <div key={comment.id} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                                                <p className="text-gray-600">{comment.message}</p>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Admin Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t mt-4">
                                    {/* Add Comment Form */}
                                    <form action={async (formData) => {
                                        "use server"
                                        const msg = formData.get("message") as string
                                        if (msg) await addComplaintComment(c.id, msg)
                                    }} className="flex-1 flex gap-2">
                                        <input
                                            name="message"
                                            placeholder="Write public update..."
                                            className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-600 outline-none"
                                        />
                                        <Button type="submit" variant="secondary" size="sm">Add Update</Button>
                                    </form>

                                    {/* Status Actions */}
                                    <div className="flex gap-2">
                                        {c.status === 'open' && (
                                            <form action={async () => {
                                                "use server"
                                                await updateComplaintStatus(c.id, 'in-progress')
                                            }}>
                                                <Button type="submit" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2">
                                                    Start Work
                                                </Button>
                                            </form>
                                        )}

                                        {(c.status === 'open' || c.status === 'in-progress') && (
                                            <form action={async () => {
                                                "use server"
                                                await updateComplaintStatus(c.id, 'resolved')
                                            }}>
                                                <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700 gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> Resolve
                                                </Button>
                                            </form>
                                        )}

                                        {c.status === 'resolved' && (
                                            <form action={async () => {
                                                "use server"
                                                await updateComplaintStatus(c.id, 'open')
                                            }}>
                                                <Button type="submit" variant="outline">Re-open</Button>
                                            </form>
                                        )}

                                        {/* Delete Button */}
                                        <DeleteComplaintButton id={c.id} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {(!complaints || complaints.length === 0) && (
                        <div className="text-center py-12 text-gray-500 italic border-2 border-dashed rounded-lg">
                            No complaints in the system yet.
                        </div>
                    )}
                </div>

                {/* Right Column: Other Tools */}
                <div className="space-y-8">
                    {/* Create Notice */}
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="bg-blue-50/50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BellRing className="h-5 w-5 text-blue-600" /> Post Notice
                            </CardTitle>
                            <CardDescription>Send updates to all residents</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form action={async (formData) => {
                                "use server"
                                const supabase = await createClient()
                                const { sendTelegramNotification } = await import('@/utils/telegram')

                                const title = formData.get("title") as string
                                const content = formData.get("content") as string
                                const priority = formData.get("priority") as string

                                const { error } = await supabase.from("notices").insert({ title, content, priority })

                                if (!error && priority === 'urgent') {
                                    await sendTelegramNotification(`📢 URGENT NOTICE: ${title}\n\n${content}`)
                                }
                                redirect("/admin")
                            }} className="space-y-4">
                                <input
                                    name="title"
                                    required
                                    placeholder="Title (e.g. Water Cutoff)"
                                    className="w-full text-sm border border-gray-200 p-2.5 rounded-md focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                                <textarea
                                    name="content"
                                    required
                                    placeholder="Message details..."
                                    className="w-full text-sm border border-gray-200 p-2.5 rounded-md h-32 focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                                <div className="flex gap-2">
                                    <select name="priority" className="flex-1 text-sm border border-gray-200 bg-white p-2.5 rounded-md outline-none">
                                        <option value="normal">Normal</option>
                                        <option value="urgent">📢 Urgent (Send Telegram)</option>
                                    </select>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Publish</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Manage Notices List */}
                    <Card>
                        <CardHeader className="py-3 border-b bg-gray-50/50">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                <BellRing className="h-4 w-4" /> Current Notices
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                {notices?.map((notice) => (
                                    <div key={notice.id} className="p-4 flex justify-between items-start gap-3 hover:bg-gray-50/50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-sm text-gray-900">{notice.title}</h4>
                                                {notice.priority === 'urgent' && (
                                                    <Badge variant="warning" className="text-[10px] px-1.5 h-4">URGENT</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2">{notice.content}</p>
                                        </div>
                                        <DeleteNoticeButton id={notice.id} />
                                    </div>
                                ))}
                                {(!notices || notices.length === 0) && (
                                    <div className="p-8 text-center text-xs text-gray-400 italic">
                                        No notices posted yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats or Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-gray-400">Admin Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3 text-gray-600">
                            <p>• Residents see the "View Complaints" dashboard to avoid duplicate reports.</p>
                            <p>• Internal notes are ONLY visible to committee members here.</p>
                            <p>• Mark complaints as "Resolved" once action is taken.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
