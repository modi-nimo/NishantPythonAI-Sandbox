"use server"

import { createClient } from "@/utils/supabase/server"
import { sendTelegramNotification } from "@/utils/telegram"
import { redirect } from "next/navigation"

export async function submitComplaint(formData: FormData) {
    const flat_no = formData.get("flat_no") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string

    const supabase = await createClient()

    // Try inserting into Supabase
    const { error } = await supabase.from("complaints").insert({
        flat_no,
        category,
        description,
        status: "open",
    })

    if (error) {
        console.error("Supabase insert error:", error)
    }

    // Trigger telegram notification
    await sendTelegramNotification(
        `🚨 <b>New Complaint</b>\n\n<b>Flat:</b> ${flat_no}\n<b>Category:</b> ${category}\n<b>Description:</b> ${description}`,
        2 // Send to "Issues" forum topic
    )

    redirect("/complaint/success")
}
