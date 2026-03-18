import { createClient } from "@/utils/supabase/server"
import {
  Bell,
  Calendar,
  FileText,
  ArrowRight,
  Clock,
  AlertTriangle,
  Inbox,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import * as motion from "framer-motion/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { transformGDriveUrl } from "@/utils/media"
import { getTowerMetadata } from "@/app/actions/metadata"

export default async function Home() {
  const supabase = await createClient()
  const metadata = await getTowerMetadata()

  // Fetch all relevant data for the Command Center
  const [noticesRes, eventsRes, docsRes] = await Promise.all([
    supabase.from("notices").select("*").order("date", { ascending: false }).limit(5),
    supabase.from("events").select("*").order("date", { ascending: true }).limit(3),
    supabase.from("documents").select("*").order("updated_at", { ascending: false }).limit(4)
  ])

  const notices = noticesRes.data || []
  const events = eventsRes.data || []
  const documents = docsRes.data || []


  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary-600/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-accent-500/10 blur-[100px]" />

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20 px-4 py-1.5 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase">
              <Sparkles className="h-3 w-3 mr-2 text-yellow-400" />
              Welcome to {metadata.name || "Tower Pulse"}
            </Badge>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold font-outfit leading-[1.1] mb-6 tracking-tight">
            Your Tower. <br />
            <span className="text-primary-400">Perfectly Connected.</span>
          </h1>

          <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">
            Experience seamless living with instant society updates and simplified complaint tracking.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-primary-500 hover:bg-primary-600 rounded-2xl px-8 h-14 font-bold shadow-xl shadow-primary-500/20 group">
              <Link href="/complaints">
                <Inbox className="mr-2 h-5 w-5" /> File an Issue
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 bg-white/5 hover:bg-white/10 rounded-2xl px-8 h-14 font-bold backdrop-blur-md">
              <Link href="/complaints">Track Status</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main: Notices Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold font-outfit flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary-500" /> Recent Updates
            </h2>
            <Link href="/notices" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">View All</Link>
          </div>

          <div className="space-y-4">
            {notices.map((notice, idx) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="glass-card group p-6 rounded-3xl"
              >
                <div className="flex gap-5">
                  <div className={`mt-1 h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center shadow-inner ${notice.priority === 'urgent'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-primary-500/10 text-primary-500'
                    }`}>
                    {notice.priority === 'urgent' ? <AlertTriangle className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg group-hover:text-primary-600 transition-colors uppercase tracking-tight">{notice.title}</h3>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        <Clock className="h-3 w-3" /> {new Date(notice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <p className="text-gray-500 leading-relaxed font-medium flex-1">{notice.content}</p>
                      {notice.image_url && (
                        <div className="h-20 w-32 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform duration-500">
                          <img src={transformGDriveUrl(notice.image_url) || ""} alt="" referrerPolicy="no-referrer" className="object-cover w-full h-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {notices.length === 0 && (
              <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed">
                <p className="text-gray-400 font-medium">No notices published recently.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Events & Docs */}
        <div className="lg:col-span-4 space-y-10">
          {/* Events */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold font-outfit flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent-500" /> Upcoming Events
            </h2>
            <div className="space-y-4">
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-accent-500 text-white rounded-xl p-2 h-12 w-12 flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-bold uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{new Date(event.event_date).getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{event.title}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Starts 10:00 AM • Main Hall</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {events.length === 0 && <p className="text-xs text-gray-400 italic px-2">No upcoming events.</p>}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
