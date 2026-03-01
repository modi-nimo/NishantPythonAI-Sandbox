"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteNotice } from "./actions"

export function DeleteNoticeButton({ id }: { id: string }) {
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this notice? This will remove it from the public homepage.")) {
            await deleteNotice(id)
        }
    }

    return (
        <Button
            onClick={handleDelete}
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            size="sm"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
