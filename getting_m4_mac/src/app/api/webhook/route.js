/**
 * LINE Messaging API の Webhook 用エンドポイント。
 * ボットにメッセージを送ると LINE からここに POST が来る。
 * イベント内の userId をコンソールに出すので、ターミナルで確認できる。
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (body.events && body.events.length > 0) {
      for (const event of body.events) {
        const userId = event?.source?.userId;
        if (userId) {
          // ターミナル（npm run dev）に表示される
          console.log("--- LINE User ID ---");
          console.log(userId);
          console.log("--------------------");
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response("OK", { status: 200 });
  }
}

