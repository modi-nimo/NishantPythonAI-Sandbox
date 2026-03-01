"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { setAdminSession } from "@/utils/auth-session"

export async function login(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const supabase = await createClient()

    // Query custom admins table by email only
    const { data: admin, error } = await supabase
        .from("admins")
        .select("*")
        .eq("email", email)
        .single()

    if (error || !admin) {
        console.error("Login failed (User not found):", error?.message)
        redirect("/admin/login?error=Invalid credentials")
    }

    // Securely compare hashed password
    const isPasswordCorrect = await bcrypt.compare(password, admin.password)

    if (!isPasswordCorrect) {
        console.error("Login failed (Invalid password for email):", email)
        redirect("/admin/login?error=Invalid credentials")
    }

    // Set custom session
    await setAdminSession(email)

    // Redirect to dashboard on success
    redirect("/admin")
}
