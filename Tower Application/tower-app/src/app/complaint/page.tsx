import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { submitComplaint } from "./actions"
import { SubmitButton } from "./submit-button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ComplaintPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">File a Complaint</CardTitle>
                    <CardDescription>
                        Submit your grievance here. It will be registered and tracked by the committee.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={submitComplaint} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="flat_no">Flat Number</Label>
                            <Input
                                id="flat_no"
                                name="flat_no"
                                required
                                placeholder="e.g. A-101"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                name="category"
                                required
                                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                                <option value="">Select a category</option>
                                <option value="Lift">Lift</option>
                                <option value="Water">Water</option>
                                <option value="Electricity">Electricity</option>
                                <option value="Security">Security</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                required
                                rows={4}
                                placeholder="Please describe the issue in detail"
                            />
                        </div>

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
