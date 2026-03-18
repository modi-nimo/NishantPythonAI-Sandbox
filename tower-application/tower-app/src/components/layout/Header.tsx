import Link from "next/link"
import { Building2 } from "lucide-react"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="h-7 w-7 text-blue-600" />
                    <Link href="/" className="font-bold text-xl tracking-tight text-gray-900">
                        Tower<span className="text-blue-600">Connect</span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
                    <Link href="/complaints" className="text-gray-600 hover:text-blue-600 transition-colors">View Complaints</Link>
                    <Link href="/complaint" className="text-gray-600 hover:text-blue-600 transition-colors">File Complaint</Link>
                    <Link href="/events" className="text-gray-600 hover:text-blue-600 transition-colors">Events</Link>
                    <Link href="/documents" className="text-gray-600 hover:text-blue-600 transition-colors">Documents</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/admin/login" className="text-sm font-medium px-4 py-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                        Admin Login
                    </Link>
                </div>
            </div>
        </header>
    )
}
