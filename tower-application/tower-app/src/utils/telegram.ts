export async function sendTelegramNotification(message: string, threadId?: number) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error("Missing Telegram configuration (Token or Chat ID)");
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: {
        chat_id: string
        text: string
        parse_mode: "HTML"
        disable_web_page_preview: boolean
        message_thread_id?: number
    } = {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
    };

    if (typeof threadId === "number" && Number.isFinite(threadId)) {
        payload.message_thread_id = threadId;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Failed to send Telegram message", await response.text());
        }
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}
