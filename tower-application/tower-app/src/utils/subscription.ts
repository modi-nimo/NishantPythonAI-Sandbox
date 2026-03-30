const SUBSCRIPTION_ENV_KEY = "SUBSCRIPTION_VALID_UNTIL"

export function getSubscriptionExpiry() {
    const rawValue = process.env[SUBSCRIPTION_ENV_KEY]?.trim()

    if (!rawValue) {
        return null
    }

    const expiry = new Date(rawValue)

    if (Number.isNaN(expiry.getTime())) {
        return null
    }

    return expiry
}

export function isSubscriptionActive(now = new Date()) {
    const expiry = getSubscriptionExpiry()

    if (!expiry) {
        return false
    }

    return now.getTime() <= expiry.getTime()
}

export function getSubscriptionExpiryLabel() {
    const expiry = getSubscriptionExpiry()

    if (!expiry) {
        return "not configured"
    }

    return expiry.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    })
}

export function assertSubscriptionActive() {
    if (!isSubscriptionActive()) {
        throw new Error("Subscription expired")
    }
}
