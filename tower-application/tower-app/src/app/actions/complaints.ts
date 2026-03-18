"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { sendTelegramNotification } from "@/utils/telegram"

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

    const complaintSummary = [
        "New complaint submitted",
        `Tower: ${process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse"}`,
        `Flat: ${payload.flat_no}`,
        `Resident: ${payload.resident_name || "Not provided"}`,
        `Phone: ${payload.phone_number || "Not provided"}`,
        `Category: ${payload.category}`,
        `Description: ${payload.description}`,
    ].join("\n")

    await sendTelegramNotification(complaintSummary)

    revalidatePath("/complaints")
    revalidatePath("/admin")
}
