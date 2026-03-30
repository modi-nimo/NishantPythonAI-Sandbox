import Link from "next/link"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSubscriptionExpiryLabel } from "@/utils/subscription"

const towerName = process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"

export default function SubscriptionExpiredPage() {
    const expiryLabel = getSubscriptionExpiryLabel()

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-3xl glass-card rounded-[3rem] p-8 md:p-12 text-center space-y-8">
                <div className="mx-auto h-20 w-20 rounded-[2rem] bg-red-500/10 text-red-500 flex items-center justify-center shadow-inner">
                    <ShieldAlert className="h-10 w-10" />
                </div>

                <div className="space-y-4">
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Access Locked
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight">
                        {towerName} Subscription Expired
                    </h1>
                    <p className="text-base md:text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        This deployment is locked because the current subscription window has ended. Renew the subscription and update the deployment environment to restore resident and committee access.
                    </p>
                </div>

                <div className="rounded-[2rem] border border-red-500/10 bg-red-500/5 px-6 py-5 inline-flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        Valid until: {expiryLabel}
                    </p>
                </div>

                <div>
                    <Button asChild size="lg" className="rounded-2xl h-14 px-8">
                        <Link href="/">Retry Access</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
