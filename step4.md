# Step 4 LINE通知 手順 📋

`reached: true` のときに LINE へ通知するため、LINE Messaging API でメッセージを送る `/api/notify` を実装する。

---

## 手順の流れ

```
① LINE Developers で準備（自分で実施）
   └─ Messaging API チャンネル作成
   └─ チャンネルアクセストークン取得
   └─ 自分の LINE User ID 取得

② 環境変数を用意
   └─ LINE_CHANNEL_ACCESS_TOKEN
   └─ LINE_USER_ID

③ /api/notify を実装
   └─ POST で「送り先 User ID」と「メッセージ」を受け取り、LINE API に push
   └─ または固定メッセージで「M4 Mac mini のページにたどり着けました」を送る
```

---

## 1. LINE Developers での準備（概要）

| 手順 | やること |
|------|----------|
| 1 | [LINE Developers](https://developers.line.biz/) でログイン（LINE アカウントで可） |
| 2 | プロバイダー作成 → **Messaging API** のチャンネルを新規作成 |
| 3 | チャンネル設定で **チャンネルアクセストークン**（長期）を発行・コピー |
| 4 | 自分の **LINE User ID** を取得（Webhook で受信する or 公式の「User ID を取得する」手順で確認） |

※ 詳細は [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/) を参照。

---

## 2. 環境変数（ローカル / Vercel）

| 変数名 | 内容 |
|--------|------|
| **LINE_CHANNEL_ACCESS_TOKEN** | チャンネルアクセストークン（Bearer で使う） |
| **LINE_USER_ID** | 通知を送る相手の LINE User ID（自分なら自分の ID） |

ローカルでは `.env.local` に置く。Vercel ではプロジェクトの Environment Variables に設定する。

---

## 3. /api/notify の役割

- **POST** で呼ぶことを想定（check-stock から「通知して」と叩く場合）。
- または **GET** でも固定メッセージを送るようにしてもよい。
- 実装では **LINE Messaging API の Push Message**（`POST https://api.line.me/v2/bot/message/push`）を使う。

---

## 4. 環境変数ファイルの用意

プロジェクト直下に `.env.local` を作成し、次を記入する。

```
LINE_CHANNEL_ACCESS_TOKEN=発行したトークン
LINE_USER_ID=自分のLINE User ID
```

※ `.env.local.example` をコピーして `.env.local` にリネームし、値を書き換えてもよい。

---

## 5. 動作確認

1. `.env.local` に `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_USER_ID` を設定
2. `npm run dev` で起動
3. ブラウザで `http://localhost:3000/api/notify` を開く（GET で固定メッセージ送信）
4. 自分の LINE に「M4 Mac mini の整備品ページにたどり着けました！」が届くか確認

---

## 次のステップ（Step 5）

- `reached: true` のときに `/api/notify` を呼ぶ処理を check-stock に追加（任意）
- Vercel にデプロイし、環境変数を設定
- Cron で `/api/check-stock` を 30 分ごとに実行
