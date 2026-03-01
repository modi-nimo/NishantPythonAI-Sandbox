import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Inbox, Search } from "lucide-react"

export default async function PublicComplaintsPage() {
    const supabase = await createClient()

    const { data: complaints, error } = await supabase
        .from("complaints")
        .select("*, comments(*)")
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Complaints Dashboard</h1>
                <p className="text-gray-500 mt-2">
                    Official tracking of tower issues and resolution progress.
                </p>
            </div>

            <div className="grid gap-6">
                {complaints?.map((complaint) => (
                    <Card key={complaint.id} className="overflow-hidden border-gray-100 shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b pb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        complaint.status === 'open' ? 'warning' :
                                            complaint.status === 'in-progress' ? 'info' : 'success'
                                    }>
                                        {complaint.status.toUpperCase()}
                                    </Badge>
                                    <span className="text-sm font-semibold text-gray-700">
                                        Flat {complaint.flat_no}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(complaint.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <CardTitle className="text-lg mt-2 font-bold text-gray-900">{complaint.category}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>

                            {/* Public Updates Section */}
                            {complaint.comments?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Search className="h-3 w-3" /> Committee Updates
                                    </h4>
                                    <div className="space-y-3">
                                        {complaint.comments.map((comment: any) => (
                                            <div key={comment.id} className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
                                                <p className="text-sm text-gray-700">{comment.message}</p>
                                                <p className="text-[10px] text-blue-400 mt-1 font-medium">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {(!complaints || complaints.length === 0) && !error && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl border-gray-200">
                        <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No complaints found</h3>
                        <p className="text-gray-500">Everything seems to be working fine in the tower!</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        Failed to load complaints. Please try again later.
                    </div>
                )}
            </div>
        </div>
    )
}

