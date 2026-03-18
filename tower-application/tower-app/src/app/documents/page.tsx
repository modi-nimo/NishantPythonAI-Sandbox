import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"
import { FileText, Download } from "lucide-react"

export default async function DocumentsPage() {
    const supabase = await createClient()

    let { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })

    if (!documents) {
        documents = []
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Documents</h1>
                    <p className="text-gray-500 mt-2">Access important society rules, forms, and guidelines.</p>
                </div>

                <div className="grid gap-4">
                    {documents.map((doc: any) => (
                        <Card key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">{doc.title}</h3>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                    <span>Download</span>
                                </a>
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
