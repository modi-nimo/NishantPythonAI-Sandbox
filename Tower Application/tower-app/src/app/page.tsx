import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { AlertCircle, FileText, Calendar, Inbox } from "lucide-react"

export default async function Home() {
  const supabase = await createClient()

  // Try to fetch real notices
  let { data: notices, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  // Handle missing data
  if (!notices) {
    notices = []
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Main Content: Notices */}
        <div className="flex-1 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Notice Board</h1>

          <div className="grid gap-4">
            {notices.map((notice: any) => (
              <Card key={notice.id} className={notice.priority === 'urgent' ? 'border-red-200 bg-red-50/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {notice.priority === 'urgent' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {notice.title}
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{notice.content}</p>
                </CardContent>
              </Card>
            ))}
            {notices.length === 0 && (
              <div className="text-center py-12 text-gray-500 border rounded-lg border-dashed">
                No notices available.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Quick Links */}
        <div className="w-full md:w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="w-full justify-start gap-2" size="lg">
                <Link href="/complaint">
                  <Inbox className="h-5 w-5" /> File a Complaint
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/events">
                  <Calendar className="h-5 w-5" /> View Events
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/documents">
                  <FileText className="h-5 w-5" /> Important Documents
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
