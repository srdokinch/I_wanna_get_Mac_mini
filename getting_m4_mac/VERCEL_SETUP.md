# Vercel デプロイ 手順まとめ

このドキュメントでは、このプロジェクトを Vercel にデプロイするまでにやったことをまとめています。

---

## 1. プロジェクトの作成

1. [Vercel](https://vercel.com) にログインする。
2. **Add New** → **Project** を選択。
3. **Import Git Repository**（左側）で、GitHub の **srdokinch/I_wanna_get_Mac_mini** を選び **Import** をクリック。

---

## 2. プロジェクト設定（New Project 画面）

| 項目 | 設定内容 |
|------|----------|
| **Root Directory** | `getting_m4_mac` に変更する（Edit で入力）。Next.js アプリがこのフォルダ内にあるため。 |
| **Project Name** | そのまま（例: i-wanna-get-mac-mini）でよい。 |
| **Application Preset** | Root を `getting_m4_mac` にすると Next.js が検出されることが多い。出なければ Other のまま。 |
| **Environment Variables** | ここで設定しても、あとから **Settings → Environment Variables** で設定してもよい。 |

必要な環境変数：

- **LINE_CHANNEL_ACCESS_TOKEN** … LINE チャンネルアクセストークン
- **LINE_USER_ID** … 通知を送る相手の LINE User ID

`.env.local` の内容を **Import .env** で貼り付けてもよい（必要な2つだけ残す）。

---

## 3. デプロイの実行

- 設定後、**Deploy** ボタンをクリックして初回デプロイを開始する。
- 以降は **main ブランチに push するたびに自動でデプロイ**される（Git 連携が正しく設定されていれば）。

---

## 4. Git 連携（push でデプロイされるようにする）

- Vercel の **Settings** → **Connected Git Repository** で **srdokinch/I_wanna_get_Mac_mini** が接続されていることを確認する。
- **Environments** で **Production** が **main** ブランチを追っていることを確認する。
- push してもデプロイが走らない場合は、一度 **Disconnect** してから同じリポジトリを **Connect** し直すと、GitHub との連携がやり直される。
- Vercel は **GitHub App** で連携するため、GitHub のリポジトリ **Webhooks** 一覧に何も出なくても正常な場合がある。

---

## 5. Cron の制限（Hobby プラン）

- **Hobby（無料）プラン** では、Cron は **1日1回まで**。
- `*/30 * * * *`（30分ごと）は使えず、デプロイ時に次のようなメッセージが出る：
  - `Hobby accounts are limited to daily cron jobs. This cron expression (*/30 * * * *) would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel.`

**対応**: `vercel.json` の `schedule` を **1日1回** に変更する。

```json
{
  "crons": [
    {
      "path": "/api/check-stock",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- **`0 0 * * *`** … 毎日 UTC 0:00 = **日本時間 9:00** に 1 回実行。
- 他の例: 毎日 12:00 UTC → `"0 12 * * *"`、毎日 18:00 UTC → `"0 18 * * *"`。  
  （Vercel の Cron は **UTC** なので、日本時間に合わせる場合は 9 時間ずらして考える。）

---

## 6. 本番 URL と動作確認

- デプロイが成功すると、本番 URL が発行される（例: **https://i-wanna-get-mac-mini.vercel.app**）。
- 確認用:
  - `https://あなたのURL/` … トップページ
  - `https://あなたのURL/api/check-stock` … 在庫チェックの JSON
  - `https://あなたのURL/api/notify` … LINE 通知（GET でテスト。本番では check-stock から自動で呼ばれる）

---

## 7. 環境変数（本番で LINE 通知を動かす場合）

- プロジェクトの **Settings** → **Environment Variables** で、上記の **LINE_CHANNEL_ACCESS_TOKEN** と **LINE_USER_ID** を設定する。
- 設定・変更後は **Redeploy** すると反映される。

---

## まとめ

| やったこと | メモ |
|------------|------|
| Import Git Repository で I_wanna_get_Mac_mini をインポート | 左の Import Git Repository を選択 |
| Root Directory を `getting_m4_mac` に設定 | 必須 |
| 環境変数を設定 | LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID |
| Deploy で初回デプロイ | Cron エラーが出たら vercel.json を 1 日 1 回に変更 |
| vercel.json の schedule を `0 0 * * *` に変更 | Hobby は 1 日 1 回まで |
| main に push で自動デプロイ | Git 連携が正しければ動作。問題なら Disconnect → Connect し直し |

これで、push 時に自動デプロイされ、毎日 1 回（日本時間 9:00）に `/api/check-stock` が実行され、`reached: true` のときは LINE に通知が届く状態になります。
