const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export const DEFAULT_LINE_MESSAGE =
  "Mac miniのページが存在しているぞ👩‍💻";

/**
 * LINE Messaging API でプッシュメッセージを送る（HTTP ルートを経由しない）。
 * check-stock から直接呼ぶことで、同一デプロイへの fetch が失敗しても通知できる。
 *
 * @param {string} [message]
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function pushLineNotify(message = DEFAULT_LINE_MESSAGE) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { sent: false, error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" };
  }
  const userId = process.env.LINE_USER_ID;
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
