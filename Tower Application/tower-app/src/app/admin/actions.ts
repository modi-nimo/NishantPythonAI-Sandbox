"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { clearAdminSession } from "@/utils/auth-session"

export async function adminLogout() {
    await clearAdminSession()
    redirect("/admin/login")
}

export async function createNotice(formData: FormData) {
    const supabase = await createClient()
    const { sendTelegramNotification } = await import('@/utils/telegram')

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const priority = formData.get("priority") as string

    if (!title || !content) throw new Error("Missing fields")

    const { error } = await supabase.from("notices").insert({ title, content, priority })

    if (error) throw new Error(error.message)

    if (priority === 'urgent') {
        await sendTelegramNotification(`📢 URGENT NOTICE: ${title}\n\n${content}`)
    }

    revalidatePath("/")
    revalidatePath("/admin")
}

export async function updateComplaintStatus(complaintId: string, newStatus: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("complaints")
        .update({ status: newStatus })
        .eq("id", complaintId)

    if (error) {
        console.error("Failed to update status:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/complaints")
    return { success: true }
}

export async function deleteComplaint(complaintId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", complaintId)

    if (error) {
        console.error("Failed to delete complaint:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/complaints")
    return { success: true }
}

export async function addComplaintComment(complaintId: string, message: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("comments")
        .insert({ complaint_id: complaintId, message })

    if (error) {
        console.error("Failed to add comment:", error)
        throw new Error("Add comment failed")
    }

    revalidatePath("/admin")
    revalidatePath("/complaints")
}

export async function deleteNotice(noticeId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", noticeId)

    if (error) {
        console.error("Failed to delete notice:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true }
}
