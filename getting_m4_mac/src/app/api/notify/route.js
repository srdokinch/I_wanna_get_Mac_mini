const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

const DEFAULT_MESSAGE = "M4 Mac mini の整備品ページにたどり着けました！";

/**
 * LINE Messaging API でプッシュメッセージを送る
 */
async function sendLineMessage(userId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { sent: false, error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" };
  }
  if (!userId) {
    return { sent: false, error: "LINE_USER_ID が設定されていません" };
  }

  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { sent: false, error: `LINE API error: ${res.status} ${text}` };
  }

  return { sent: true };
}

export async function GET() {
  return handleNotify(DEFAULT_MESSAGE);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body.message || DEFAULT_MESSAGE;
    return handleNotify(message);
  } catch (e) {
    return Response.json(
      { ok: false, sent: false, error: e.message },
      { status: 500 }
    );
  }
}

async function handleNotify(message) {
  try {
    const userId = process.env.LINE_USER_ID;
    const result = await sendLineMessage(userId, message);

    if (!result.sent) {
      return Response.json(
        { ok: false, ...result },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, sent: true });
  } catch (e) {
    return Response.json(
      { ok: false, sent: false, error: e.message },
      { status: 500 }
    );
  }
}
