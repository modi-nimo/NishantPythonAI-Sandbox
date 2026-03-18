import { cookies } from 'next/headers'

const SESSION_COOKIE = 'tower_admin_session'

export async function setAdminSession(email: string) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    })
}

export async function getAdminSession() {
    const cookieStore = await cookies()
    return cookieStore.get(SESSION_COOKIE)?.value
}

export async function clearAdminSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}
