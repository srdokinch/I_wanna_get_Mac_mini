# src/app/api 配下の route.js 一覧

このドキュメントでは、`src/app/api` 配下の各 API ルート（`route.js`）の**役割**と**中身**を説明します。

---

## 1. `/api/notify` — notify/route.js

### 役割

LINE Messaging API の**プッシュメッセージ**を送るエンドポイントです。  
「在庫あり」の通知や、手動でメッセージを送りたいときに使います。

| メソッド | 用途 | 該当コード |
|---------|------|------------|
| **GET** | ブラウザで `/api/notify` を開くと、固定メッセージで LINE に1通送る（**テスト用**。本番では使わない）。 | notify/route.js 36-38 行目 |
| **POST** | `body.message` を指定してメッセージを送る。未指定なら固定メッセージ。**実際の運用**では Cron や check-stock からここを呼ぶ。 | notify/route.js 40-51 行目 |

### 中身の構成

- **定数**（notify/route.js 1-3 行目）
  - `LINE_PUSH_URL` … LINE の Push API の URL（1 行目）
  - `DEFAULT_MESSAGE` … デフォルトの通知文（例: 「Mac miniのページが存在しているぞ〜」）（3 行目）

- **sendLineMessage(userId, message)**（内部関数・8-34 行目）
  - `process.env.LINE_CHANNEL_ACCESS_TOKEN` と `userId` をチェック（9-15 行目）
  - `LINE_PUSH_URL` に POST して、指定ユーザーにテキストを1通送る（17-26 行目）
  - 成功時は `{ sent: true }`、失敗時は `{ sent: false, error: "..." }` を返す（28-33 行目）（HTTP レスポンスは返さない）

- **handleNotify(message)**（内部関数・52-71 行目）
  - `process.env.LINE_USER_ID` を取得し、`sendLineMessage` を呼ぶ（54-55 行目）
  - 送信失敗 → `400` と `{ ok: false, ...result }`（57-62 行目）
  - 送信成功 → `200` と `{ ok: true, sent: true }`（65 行目）
  - 例外時 → `500` と `{ ok: false, sent: false, error }`（66-70 行目）

- **export async function GET()**（36-38 行目）
  - `handleNotify(DEFAULT_MESSAGE)` を呼ぶだけ。ブラウザで開くとここが実行される。

- **export async function POST(request)**（40-51 行目）
  - `request.json()` で body を取得し、`body.message` または `DEFAULT_MESSAGE` で `handleNotify` を呼ぶ（42-44 行目）。パース失敗時は 500 を返す（45-50 行目）。

### 必要な環境変数

- `LINE_CHANNEL_ACCESS_TOKEN` … LINE チャネルのアクセストークン
- `LINE_USER_ID` … 通知を送る相手の LINE User ID

---

## 2. `/api/webhook` — webhook/route.js

### 役割

LINE Messaging API の**Webhook 用エンドポイント**です。  
ユーザーが LINE ボットにメッセージを送ると、LINE プラットフォームからここに **POST** が飛んできます。  
このプロジェクトでは「**LINE User ID を取得するため**」に使っています。Webhook で届いたイベントから `userId` を取り出し、ターミナルに表示します。

### 中身の構成

- **export async function POST(request)** のみ（GET はなし）（webhook/route.js 6-26 行目）
  1. `request.json()` で LINE から送られてきた body を取得（8 行目）
  2. `body.events` が存在し、配列に要素があればループ（10-19 行目）
  3. 各 `event` から `event.source.userId` を取得し、`console.log` でターミナルに出力（12-17 行目）
  4. 成功・失敗どちらでも **`200` と `"OK"`** を返す（21 行目・24 行目）（LINE の Webhook は 200 を返さないと再送するため）

### 使い方の流れ

1. LINE Developers で Webhook URL を `https://あなたのドメイン/api/webhook` に設定
2. ユーザーがボットにメッセージを送る
3. LINE が `/api/webhook` に POST する
4. サーバー（`npm run dev` のターミナル）に「--- LINE User ID ---」と `userId` が表示される
5. その `userId` を `.env.local` の `LINE_USER_ID` に設定し、`/api/notify` で使う

---

## 3. `/api/check-stock` — check-stock/route.js

### 役割

Apple 公式の **Mac mini 整備品ページ**に、**リダイレクトなしで 200 が返るか**だけを判定するエンドポイントです。  
スクレイピングは行わず、「ページにたどり着けたか」だけをチェックします。在庫監視の前段として、Cron などから GET で叩く想定です。

### 中身の構成

- **定数**（check-stock/route.js 2-5 行目）
  - `APPLE_REFURB_MAC_MINI_URL` … 対象URL（2-3 行目）
  - `REDIRECT_STATUSES` … リダイレクトとみなす HTTP ステータス（301, 302, 307, 308）（5 行目）

- **checkMacMiniPageReachable()**（内部関数・11-29 行目）
  - 上記 URL に `fetch` で GET。`redirect: "manual"` なのでリダイレクトは自動追従しない（12-18 行目）
  - レスポンスの `status` が 301/302/307/308 → `{ reached: false, redirected: true, error: "redirected" }`（20-22 行目）
  - `status === 200` → `{ reached: true, redirected: false }`（24-26 行目）
  - それ以外 → `{ reached: false, redirected: false, error: "HTTP 4xx" }` など（28 行目）

- **export async function GET()**（30-45 行目）
  - `checkMacMiniPageReachable()` を実行し、その結果をそのまま JSON で返す（32-37 行目）
  - 例外時は `500` と `{ reached: false, error: e.message }`（39-43 行目）

### 返却 JSON の例

- ページに到達できた場合: `{ "reached": true, "redirected": false }`
- リダイレクトされた場合: `{ "reached": false, "redirected": true, "error": "redirected" }`
- その他エラー: `{ "reached": false, "error": "HTTP 404" }` など

---

## まとめ

| パス | ファイル | 主な役割 |
|------|----------|-----------|
| `/api/notify` | notify/route.js | LINE にプッシュメッセージを送る（GET=固定文、POST=任意文） |
| `/api/webhook` | webhook/route.js | LINE の Webhook 受信。イベントから User ID を取得してターミナルに表示 |
| `/api/check-stock` | check-stock/route.js | Mac mini 整備品ページが 200 で到達可能かだけを判定 |

これらを組み合わせて、「check-stock で在庫ありと判定 → notify で LINE に通知」といったフローを構築できます。
