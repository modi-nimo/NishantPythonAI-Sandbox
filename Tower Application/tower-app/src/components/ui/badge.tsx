import { cn } from "@/utils/cn"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-700",
        warning: "bg-orange-100 text-orange-700",
        error: "bg-red-100 text-red-700",
        info: "bg-blue-100 text-blue-700",
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}
