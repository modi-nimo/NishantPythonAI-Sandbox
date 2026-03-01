export async function sendTelegramNotification(message: string, threadId?: number) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error("Missing Telegram configuration (Token or Chat ID)");
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                message_thread_id: threadId,
                parse_mode: 'HTML'
            }),
        });

        if (!response.ok) {
            console.error("Failed to send Telegram message", await response.text());
        }
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}
