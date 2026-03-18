"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

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

    revalidatePath("/complaints")
    revalidatePath("/admin")
}
