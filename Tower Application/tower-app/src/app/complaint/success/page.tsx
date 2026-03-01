import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function ComplaintSuccessPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-lg">
            <Card className="text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 text-green-600 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Complaint Submitted</CardTitle>
                    <CardDescription>
                        Your issue has been successfully registered and the committee has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/">Return to Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
