"use server"

import { createClient } from "@/utils/supabase/server"

type TowerMetadata = {
    name: string
    address?: string | null
    secretary_contact?: string | null
    manager_contact?: string | null
    branding_color?: string | null
}

export async function getTowerMetadata(): Promise<TowerMetadata> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("tower_metadata")
        .select("name, address, secretary_contact, manager_contact, branding_color")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data ?? { name: process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse" }
}
