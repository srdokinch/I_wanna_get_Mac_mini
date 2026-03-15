# Step 3・Step 4 のコード解説（詳しめ）

コードを見ながら、何をしているかを説明する。

---

## API の基礎（初心者向け要約）

Step 3・Step 4 では「API にリクエストを送る」処理が出てくる。ここではその前提として、**API とは何か**「**POST**」や「**body**」が何を指すかを要約する。

### API とは

**API** は、あるサービス（LINE など）の機能を **プログラムから使うための窓口**。  
人間はブラウザやアプリの画面で操作するが、プログラムは **決まった URL に、決まった形式でリクエストを送る** ことで同じ機能を呼び出す。

### GET と POST

- **GET**: 「この URL の内容を**くれ**」と取りにいくだけ。ブラウザで URL を開くときは GET。**送る「中身（body）」は基本的にない**。
- **POST**: 「**このデータを渡すから、これに基づいて処理して**」と、**データ（body）を付けて送る**。メッセージ送信・データ登録などで使う。

LINE の「メッセージを送る」は「相手にデータ（メッセージ）を届けて」なので **POST** で **body** に送信内容を書く。

### 1回のリクエストに含まれるもの

| 部分 | 役割 | 例 |
|------|------|-----|
| **URL** | どこの API に送るか | `https://api.line.me/v2/bot/message/push` |
| **メソッド** | 何をしたいか | GET（取りにいく） / **POST（データを渡す）** |
| **ヘッダー（headers）** | 付帯情報（認証トークン、データ形式など） | `Authorization: Bearer トークン`, `Content-Type: application/json` |
| **ボディ（body）** | **送るデータの中身**（POST のときなどに使う） | 「誰に」「どんなメッセージを」送るか、を書いた JSON |

**body** = その HTTP リクエストの「本体」。POST で「何を送るか」を書く部分。

### 形式・内容は API ごとに違う

- **body の形式**: JSON、フォームデータ（`key=value&...`）、XML など。**API の仕様で決まっている**。
- **body に何を書くか**: 送り先・メッセージ・ID など、**API ごとに項目（パラメータ）が違う**。

使うときは **その API の公式ドキュメント** で「リクエストの形式とパラメータ」を確認する。

### LINE のプッシュメッセージ API の公式ドキュメント

- **メッセージを送信する**（送り方の説明）:  
  [https://developers.line.biz/ja/docs/messaging-api/sending-messages/](https://developers.line.biz/ja/docs/messaging-api/sending-messages/)
- **Send push message**（リファレンス・パラメータ詳細）:  
  [https://developers.line.biz/ja/reference/messaging-api/#send-push-message](https://developers.line.biz/ja/reference/messaging-api/#send-push-message)

---

## Step 3: 在庫チェック（/api/check-stock）

**目的**: Apple の Mac mini 整備品ページに、**リダイレクトされずに 200 でたどり着けたか** だけを判定する。HTML は読まない（スクレイピングなし）。

---

### 1. 定数

```javascript
const APPLE_REFURB_MAC_MINI_URL =
  "https://www.apple.com/jp/shop/refurbished/mac/mac-mini";

const REDIRECT_STATUSES = [301, 302, 307, 308];
```

- **APPLE_REFURB_MAC_MINI_URL**: 判定対象の URL。ここにアクセスした結果だけを見る。
- **REDIRECT_STATUSES**: 「リダイレクト」とみなす HTTP ステータス。301/302/307/308 のどれかなら「別の URL に飛ばされた」と判断する。

---

### 2. 本体の判定: `checkMacMiniPageReachable()`

```javascript
async function checkMacMiniPageReachable() {
  const res = await fetch(APPLE_REFURB_MAC_MINI_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    redirect: "manual",
  });
```

- **fetch**: 上記 URL に GET でアクセスする。
- **User-Agent**: ブラウザっぽい値にして、ブロックされにくくする。
- **redirect: "manual"**: リダイレクトを**追わない**。  
  → サーバーが 301 などを返しても、そのまま「最初のレスポンス」だけを受け取る。  
  → だから「リダイレクトされたかどうか」を `res.status` で判定できる。

```javascript
  if (REDIRECT_STATUSES.includes(res.status)) {
    return { reached: false, redirected: true, error: "redirected" };
  }

  if (res.status === 200) {
    return { reached: true, redirected: false };
  }

  return { reached: false, redirected: false, error: `HTTP ${res.status}` };
}
```

- **301/302/307/308**: 「リダイレクトされた」→ `reached: false`, `redirected: true`。
- **200**: 「その URL でページが返ってきた」→ `reached: true`。
- **それ以外**: エラーとして `reached: false` と `error` を返す。

**ポイント**: `res.text()` や HTML の解析は一切していない。ステータスコードだけを見ている。

---

### 3. API の入口: `GET`

```javascript
export async function GET() {
  try {
    const result = await checkMacMiniPageReachable();
    return Response.json({
      reached: result.reached,
      redirected: result.redirected || undefined,
      error: result.error || undefined,
    });
  } catch (e) {
    return Response.json(
      { reached: false, error: e.message },
      { status: 500 }
    );
  }
}
```

- ブラウザや Cron が `GET /api/check-stock` を呼ぶと、この `GET` が実行される。
- `checkMacMiniPageReachable()` の戻り値をそのまま JSON で返す。
- 例外が出たら 500 と `reached: false` を返す。

**まとめ（Step 3）**: 「mac-mini の URL に fetch して、ステータスが 200 なら reached: true、リダイレクトなら reached: false」というだけの API。

---

## Step 4: LINE 通知（/api/notify）と Webhook（/api/webhook）

Step 4 は **通知を送る API** と **User ID を取得するための Webhook** の2本立て。

---

### LINE の「プッシュメッセージ」API とは（仕組みと利用方法）

**プッシュメッセージ** は、**ユーザーが先にメッセージを送っていなくても、ボット（公式アカウント）側から一方的にメッセージを送れる** 機能です。  
「在庫が出たので通知する」のように、**こちらのタイミングで送りたいとき** に使います。

#### 仕組み（流れ）

```
1. 私たちのサーバー（Next.js）
   「LINE さん、このユーザーにこのメッセージを届けて」と
   LINE のサーバー（api.line.me）に HTTP でお願いする（POST）

2. LINE のサーバー
   - 送信元が「このチャンネルのボット」だと認証（Bearer トークン）で確認
   - 送り先（userId）とメッセージ内容を受け取る
   - そのユーザーの LINE アプリにメッセージを配信する

3. ユーザーのスマホ
   LINE アプリに通知が届く
```

つまり **私たち → LINE の API（POST）→ LINE のサーバーがユーザーに配信** という一方向の流れです。  
ユーザーが「メッセージを送る」必要はなく、**私たちが「送って」とリクエストするだけ**で届きます。

#### どうやって利用しているか（コードでやっていること）

- **URL**: `https://api.line.me/v2/bot/message/push`  
  LINE が用意した「プッシュメッセージを送る」ための公式エンドポイント。
- **認証**: リクエストのヘッダーに `Authorization: Bearer チャンネルアクセストークン` を付ける。  
  LINE は「このトークンを持っている = このボットの管理者」と判断し、そのボットとして送信できる。
- **送信内容**:  body に JSON で  
  - `to`: 送り先の **LINE User ID**（誰の LINE に届けるか）  
  - `messages`: 送るメッセージの配列（今回は `[{ type: "text", text: "..." }]` でテキスト1通）  
  を指定して **POST** する。

私たちのコードでは、`fetch(LINE_PUSH_URL, { method: "POST", headers: { Authorization: Bearer ... }, body: JSON.stringify({ to: userId, messages: [...] }) })` で、上記をそのまま実行しています。  
成功すると LINE が 200 を返し、指定した User ID の LINE アプリにメッセージが届く、という仕組みです。

---

### 4. 通知を送る: `sendLineMessage(userId, message)`

```javascript
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

async function sendLineMessage(userId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { sent: false, error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" };
  }
  if (!userId) {
    return { sent: false, error: "LINE_USER_ID が設定されていません" };
  }
```

- **LINE_PUSH_URL**: 上で説明した、LINE の「プッシュメッセージ」用の公式 API の URL。
- トークンか userId が無い場合は、ここでエラーを返して送信しない。

```javascript
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
```

- **Authorization: Bearer ${token}**: LINE の認証。`.env.local` の `LINE_CHANNEL_ACCESS_TOKEN` をそのまま使う。
- **body**: 「誰に（to）」「どんなメッセージを（messages）」送るかを JSON で指定。  
  `type: "text"` なので、普通のテキスト1通を送る。

```javascript
  if (!res.ok) {
    const text = await res.text();
    return { sent: false, error: `LINE API error: ${res.status} ${text}` };
  }
  return { sent: true };
}
```

- LINE の API が 2xx 以外を返したら `sent: false` とエラー内容を返す。
- 成功なら `sent: true` だけ返す。

---

### 5. 通知 API の入口: `handleNotify(message)` と GET/POST

```javascript
const DEFAULT_MESSAGE = "M4 Mac mini の整備品ページにたどり着けました！";

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
```

- **GET**: 固定メッセージ（DEFAULT_MESSAGE）で 1 通送る。ブラウザで `/api/notify` を開くとこれが動く。
- **POST**: リクエスト body の `message` を使う。無ければ DEFAULT_MESSAGE。  
  → どちらも「送る文言」を決めたうえで `handleNotify(message)` に渡している。

```javascript
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
```

- **userId**: 必ず `.env.local` の `LINE_USER_ID`（通知先）。今回は自分用なので、Webhook で取得した自分の User ID を入れている。
- `sendLineMessage` の結果が `sent: false` なら 400 とエラー内容を返す。成功なら `{ ok: true, sent: true }`。

**まとめ（/api/notify）**: 「環境変数のトークンと User ID を使って、LINE の Push API に 1 通送る」だけ。GET は固定文、POST は `body.message` で文を変えられる。

---

### 6. Webhook（/api/webhook）: User ID を取得する

```javascript
export async function POST(request) {
  try {
    const body = await request.json();

    if (body.events && body.events.length > 0) {
      for (const event of body.events) {
        const userId = event?.source?.userId;
        if (userId) {
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
```

- **誰が呼ぶか**: LINE のサーバー。あなたがボットにメッセージを送ると、LINE が「Webhook URL」に **POST** する。  
  その URL を、ngrok で公開した `https://xxx.ngrok-free.app/api/webhook` にしておく。
- **body**: LINE が送ってくる JSON。  
  - `body.events`: イベントの配列（メッセージが届いた、など）。
  - 各 `event.source.userId`: そのイベントを起こしたユーザーの LINE User ID。
- **やっていること**: 各イベントから `userId` を取り出し、`console.log` でターミナルに出す。  
  → 自分がボットに「こんにちは」と送ると、ターミナルに自分の User ID が出る。それを `.env.local` の `LINE_USER_ID` にコピーする。
- **返すもの**: 常に `200 OK` と `"OK"`。LINE は「200 が返れば受け取れた」と判断する。  
  エラーでも 200 を返しているのは、LINE に「受け取った」と伝えて再送を防ぐため。

**まとめ（/api/webhook）**: 「LINE から送られてくるイベントを受け取り、その中の userId をログに出す。通知を送る処理はしない。」

---

## 3 つの API の関係（図）

```
[あなたがブラウザで /api/notify を開く]
        → GET /api/notify
        → handleNotify(DEFAULT_MESSAGE)
        → sendLineMessage(LINE_USER_ID, "M4 Mac mini の...")
        → LINE のサーバーに POST
        → あなたの LINE にメッセージが届く

[あなたがボットにメッセージを送る]
        → LINE が POST /api/webhook を叩く
        → body.events から userId を取得
        → console.log(userId)
        → ターミナルに User ID が表示される（.env.local に書く用）

[誰か（または Cron）が /api/check-stock を叩く]
        → GET /api/check-stock
        → checkMacMiniPageReachable()
        → Apple の URL に fetch（redirect: "manual"）
        → 200 なら { reached: true }、リダイレクトなら { reached: false }
        → （現状はここで終わり。reached: true のときに /api/notify を呼ぶ処理は未実装）
```

---

## 用語の対応

| コード上の名前 | 意味 |
|----------------|------|
| `reached` | mac-mini の URL に 200 でたどり着けたか |
| `redirect: "manual"` | リダイレクトを追わず、最初のレスポンスのステータスだけ使う |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE に「このボットとして」認証するためのトークン |
| `LINE_USER_ID` | メッセージを送る相手（今回は自分）の ID |
| `body.events[].source.userId` | Webhook で LINE が送ってくる「誰が操作したか」の ID |

以上が、Step 3 と Step 4 の「コードで何をしているか」の説明です。
