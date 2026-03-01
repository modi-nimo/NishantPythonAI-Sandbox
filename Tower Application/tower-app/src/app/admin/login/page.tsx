import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "./actions"
import { SubmitButton } from "./submit-button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Admin Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the committee dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={login} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="admin@towerconnect.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
