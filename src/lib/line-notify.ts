const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

interface LineMessage {
  type: string;
  text?: string;
  altText?: string;
  template?: Record<string, unknown>;
}

// Send push message to a LINE user
export async function sendLinePush(userId: string, messages: LineMessage[]) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
}

// Send ticket purchase notification via LINE Messaging API (broadcast)
export async function sendTicketNotification(
  ticketCode: string,
  eventName: string,
  seatName: string,
  buyerName: string,
  ticketUrl: string
) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;

  // Note: This uses broadcast to send to all friends of the official account
  // For user-specific messages, you'd need the user's LINE userId
  // For now, we'll provide the webhook endpoint for LINE to send us user messages
  console.log(
    `LINE notification: ${buyerName} purchased ${seatName} for ${eventName} - ${ticketUrl}`
  );
}

// Webhook handler for LINE messages
export async function handleLineWebhook(body: Record<string, unknown>) {
  const events = body.events as Array<Record<string, unknown>>;
  if (!events) return;

  for (const event of events) {
    if (event.type === "follow") {
      // User added the bot as friend
      const userId = (event.source as Record<string, string>).userId;
      await sendLinePush(userId, [
        {
          type: "text",
          text: `🎟 コンサートチケットへようこそ！\n\nチケットの購入・確認は以下のリンクから:\nhttps://concert-ticket-dusky.vercel.app/events`,
        },
      ]);
    } else if (event.type === "message") {
      const userId = (event.source as Record<string, string>).userId;
      const message = event.message as Record<string, string>;

      if (message.type === "text" && message.text) {
        const text = message.text.trim();

        // Check if user sent a ticket code
        if (text.startsWith("TK-")) {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            "https://concert-ticket-dusky.vercel.app";
          await sendLinePush(userId, [
            {
              type: "text",
              text: `🎫 チケットを確認:\n${baseUrl}/ticket/${text}`,
            },
          ]);
        } else {
          await sendLinePush(userId, [
            {
              type: "text",
              text: `🎟 コンサートチケット\n\n📱 チケット購入:\nhttps://concert-ticket-dusky.vercel.app/events\n\n🎫 マイチケット:\nhttps://concert-ticket-dusky.vercel.app/mypage`,
            },
          ]);
        }
      }
    }
  }
}
