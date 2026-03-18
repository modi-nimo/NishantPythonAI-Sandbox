import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

export default async function EventsPage() {
    const supabase = await createClient()

    let { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })

    if (!events) {
        events = []
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events</h1>
                    <p className="text-gray-500 mt-2">Upcoming celebrations, meetings, and activities.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    {events.map((event: any) => {
                        const date = new Date(event.event_date);
                        return (
                            <Card key={event.id}>
                                <CardHeader>
                                    <CardTitle className="text-xl">{event.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-gray-700">{event.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{date.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
