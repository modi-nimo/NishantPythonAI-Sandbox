"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { sendTelegramNotification } from "@/utils/telegram"

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
}

export async function submitComplaint(formData: FormData) {
    const supabase = await createClient()

    const payload = {
        flat_no: String(formData.get("flat_no") || "").trim(),
        resident_name: String(formData.get("resident_name") || "").trim() || null,
        phone_number: String(formData.get("phone_number") || "").trim() || null,
        category: String(formData.get("category") || "").trim(),
        description: String(formData.get("description") || "").trim(),
    }

    if (!payload.flat_no || !payload.category || !payload.description) {
        throw new Error("Missing required complaint fields")
    }

    const { error } = await supabase.from("complaints").insert(payload)

    if (error) {
        throw new Error(error.message)
    }

    const issuesThreadId = Number(process.env.TELEGRAM_ISSUES_THREAD_ID)
    const complaintSummary = [
        "🚨 <b>New Issue Reported</b>",
        "",
        `🏢 <b>Tower:</b> ${escapeHtml(process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse")}`,
        `🏠 <b>Flat:</b> ${escapeHtml(payload.flat_no)}`,
        `👤 <b>Resident:</b> ${escapeHtml(payload.resident_name || "Not provided")}`,
        `📞 <b>Phone:</b> ${escapeHtml(payload.phone_number || "Not provided")}`,
        `🛠️ <b>Category:</b> ${escapeHtml(payload.category)}`,
        "",
        "📝 <b>Description</b>",
        escapeHtml(payload.description),
    ].join("\n")

    await sendTelegramNotification(
        complaintSummary,
        Number.isFinite(issuesThreadId) ? issuesThreadId : undefined
    )

    revalidatePath("/complaints")
    revalidatePath("/admin")
}
