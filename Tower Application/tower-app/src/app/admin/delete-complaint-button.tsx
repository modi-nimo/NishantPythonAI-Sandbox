"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteComplaint } from "./actions"

export function DeleteComplaintButton({ id }: { id: string }) {
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) {
            await deleteComplaint(id)
        }
    }

    return (
        <Button
            onClick={handleDelete}
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            size="sm"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
