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

**注意**: 現在、LINE Developers コンソールから Messaging API チャンネルを**直接は作成できません**。まず **LINE 公式アカウント** を作成し、**LINE Official Account Manager** で Messaging API を有効にする流れになります。

### パターンA: まだチャンネルを1つも作っていない場合

| 手順 | やること |
|------|----------|
| 1 | [LINE Developers](https://developers.line.biz/) でログイン（LINE アカウントで可） |
| 2 | 「**LINE公式アカウントを作成する**」の緑ボタンを押す（外部サイトへ移動）。LINE 公式アカウントを作成する。 |
| 3 | **LINE Official Account Manager**（公式アカウント管理画面）で、そのアカウントの設定から **Messaging API の利用を有効化** する。 |
| 4 | 有効化後、LINE Developers コンソール側に Messaging API 用チャンネルが紐づく。**チャネル設定** → **「Messaging API」** を開き、**チャンネルアクセストークン**（長期）を発行・コピーする。 |
| 5 | 自分の **LINE User ID** を取得（後述または [Messaging API を始めよう](https://developers.line.biz/ja/docs/messaging-api/getting-started/) を参照） |

※ くわしくは公式の「[Messaging API を始めよう](https://developers.line.biz/ja/docs/messaging-api/getting-started/)」を参照。

### パターンB: すでに Messaging API チャンネルがある場合（例: 「Messaging API for Mac mini」）

| 手順 | やること |
|------|----------|
| 1 | 該当チャンネルの **チャネル設定** を開く。 |
| 2 | 一覧から **「Messaging API」**（スマホと吹き出しのアイコン）を選択する。 |
| 3 | 表示された画面で **チャンネルアクセストークン**（長期）を発行・コピーする。 |
| 4 | 自分の **LINE User ID** を取得する。 |

---

## 2. LINE User ID を Webhook で取得する（ngrok 以降の手順）

ngrok のインストールと起動ができたら、次の順で進める。

### 2-1. ngrok を起動する

1. **ターミナル1**: `getting_m4_mac` で `npm run dev` を実行（起動したまま）
2. **ターミナル2**: どこでもよいので `ngrok http 3000` を実行
3. 表示された **Forwarding** の **HTTPS の URL** をコピーする  
   例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`  
   （ドメインは毎回変わるので、そのとき表示されているものをコピーする）

### 2-2. LINE Developers で Webhook を設定する

1. [LINE Developers](https://developers.line.biz/) にログイン
2. 使っている **Messaging API チャンネル** を開く
3. **Messaging API** タブ（または左メニューの Messaging API）を開く
4. **「Webhook 設定」** のセクションを探す
5. **Webhook URL** に次を入力（ngrok の URL の末尾に `/api/webhook` を付ける）  
   `https://あなたのngrokのURL/api/webhook`  
   例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhook`
6. **「検証」** ボタンを押し、成功するか確認する
7. **「利用する」** をオンにして、Webhook を有効にする

### 2-3. User ID を取得する

1. スマホの LINE で、そのボット（公式アカウント）に **「こんにちは」** などメッセージを1つ送る
2. **`npm run dev` を実行しているターミナル** を見る
3. 次のように表示されていれば成功：  
   `--- LINE User ID ---`  
   `U1234567890abcdef...`  
   `--------------------`
4. この **`U` から始まる文字列** があなたの **LINE User ID**
5. `.env.local` の `LINE_USER_ID=` の右に、この文字列を貼り付けて保存する

※ ngrok を止めると URL が変わるので、次回 Webhook を使うときは LINE Developers の Webhook URL を再度更新する。User ID は一度取得すれば同じ値を使い続けてよい。

---

## 3. 環境変数（ローカル / Vercel）

| 変数名 | 内容 |
|--------|------|
| **LINE_CHANNEL_ACCESS_TOKEN** | チャンネルアクセストークン（Bearer で使う） |
| **LINE_USER_ID** | 通知を送る相手の LINE User ID（自分なら自分の ID） |

ローカルでは `.env.local` に置く。Vercel ではプロジェクトの Environment Variables に設定する。

---

## 4. /api/notify の役割

- **POST** で呼ぶことを想定（check-stock から「通知して」と叩く場合）。
- または **GET** でも固定メッセージを送るようにしてもよい。
- 実装では **LINE Messaging API の Push Message**（`POST https://api.line.me/v2/bot/message/push`）を使う。

---

## 5. 環境変数ファイルの用意

プロジェクト直下に `.env.local` を作成し、次を記入する。

```
LINE_CHANNEL_ACCESS_TOKEN=発行したトークン
LINE_USER_ID=自分のLINE User ID
```

※ `.env.local.example` をコピーして `.env.local` にリネームし、値を書き換えてもよい。

---

## 6. 動作確認

1. `.env.local` に `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_USER_ID` を設定
2. `npm run dev` で起動
3. ブラウザで `http://localhost:3000/api/notify` を開く（GET で固定メッセージ送信）
4. 自分の LINE に「M4 Mac mini の整備品ページにたどり着けました！」が届くか確認

---

## 次のステップ（Step 5）

- `reached: true` のときに `/api/notify` を呼ぶ処理を check-stock に追加（任意）
- Vercel にデプロイし、環境変数を設定
- Cron で `/api/check-stock` を 30 分ごとに実行
