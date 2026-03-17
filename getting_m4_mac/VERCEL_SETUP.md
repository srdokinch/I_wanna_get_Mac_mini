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

## 8. Cron が動かないときの Vercel 確認

Cron のスケジュール実行がログに出ない・LINE に通知が来ない場合、以下を**順番に**確認する。

### 8.1 プロジェクトを開く

1. [Vercel](https://vercel.com) にログインする。
2. ダッシュボードで **i-wanna-get-mac-mini**（または自分のプロジェクト名）をクリックし、**そのプロジェクトの画面**に入る。  
   （チームや「All Projects」の一覧から選ぶ。）

---

### 8.2 Root Directory（必須）

Cron の設定は **Root Directory で指定したフォルダ内の `vercel.json`** が使われる。ここが違うと cron が登録されない。

1. 左サイドバー **Settings** をクリック。
2. 一覧から **General** をクリック（Settings のサブメニューやタブ）。
3. 下にスクロールして **Root Directory** の項目を探す。
4. **値が `getting_m4_mac` になっているか** 確認する。
   - **空欄** や **`.`** のまま → リポジトリ直下がルートになる。このプロジェクトはアプリが `getting_m4_mac` 内にあるので、**`getting_m4_mac` に変更**する。
   - 変更した場合は **Save** し、**Redeploy**（後述）を行う。

---

### 8.3 Production ブランチ（Cron は本番だけ動く）

Cron は **Production デプロイ** にだけ紐づく。Preview 用のデプロイでは動かない。

1. **Settings** → **Git**（または **Connected Git Repository** のあたり）を開く。
2. **Production Branch**（本番ブランチ）を確認する。
   - 通常は **`main`** になっている。
   - `vercel.json` を編集しているブランチが **main であること**、または Production Branch がそのブランチになっていることを確認する。
3. **Environments** の表で **Production** にチェックが入っている環境（例: Production）が、そのブランチからデプロイされるようになっているか確認する。

---

### 8.4 どのデプロイが「本番」か確認する

**Deployments ページの開き方**（UI やアカウントによっては URL が異なり、`/deployments` で 404 になる場合があります）:

1. **プロジェクトの「トップ」に戻る**  
   `https://vercel.com/srdokinchs-projects/i-wanna-get-mac-mini/settings/build-and-deployment` にいるときは、アドレスバーの **`i-wanna-get-mac-mini`** の部分をクリックするか、または **`/settings/build-and-deployment` を削除**して  
   **`https://vercel.com/srdokinchs-projects/i-wanna-get-mac-mini`**  
   だけにして Enter。プロジェクトの Overview（概要）ページが開く。

2. **その画面から Deployments を探す**  
   - 左サイドバーに **Deployments** のリンクがあればそれをクリック。  
   - または、画面上部・プロジェクト名の下に **Overview** / **Deployments** / **Logs** / **Settings** などのタブやリンクがあれば **Deployments** をクリック。  
   - Overview に「最新のデプロイ」一覧や **View all** のようなリンクがあれば、そこからデプロイ一覧へ進める。

3. **ダッシュボード経由**  
   [vercel.com/dashboard](https://vercel.com/dashboard) を開く → 一覧で **i-wanna-get-mac-mini** をクリック → 開いたプロジェクト画面で上記と同様に **Deployments** のリンクやタブを探す。

**確認手順:**

1. 上記のいずれかで **Deployments** 一覧を開く。
2. 一覧の各デプロイには **Production** または **Preview** のラベルが付いている。
3. **Production** と表示されているデプロイが、**main（または設定した Production Branch）の最新**であることを確認する。
4. その Production デプロイをクリック → **Building** / **Ready** など、**正常に完了しているか** を確認する。  
   **Failed** や **Canceled** のままなら、その状態では Cron も動かない。

---

### 8.5 Cron Jobs の有効化と内容

1. **Settings** → **Cron Jobs** をクリック。
2. **Cron Jobs** が **Enabled**（オン）になっているか確認する。オフならオンにする。
3. 一覧に **`/api/check-stock`** が **`0 0 * * *`** で出ているか確認する。
   - 出ていない → その時点の本番デプロイに `vercel.json` が含まれていない可能性。**8.2** と **8.4** を見直し、**Redeploy** する。

---

### 8.6 再デプロイ（Redeploy）のやり方

設定を変えたあとや、Cron が反映されていないときは、**本番を再デプロイ**すると cron が作り直される。

1. **Deployments** を開く。
2. **一番上（最新）の Production デプロイ** の行の **⋯**（メニュー）をクリック。
3. **Redeploy** を選ぶ。
4. **Redeploy** 確認ダイアログで、オプションはそのままで **Redeploy** を実行する。
5. ビルドが完了したら、**Settings** → **Cron Jobs** で再度 `/api/check-stock` が並んでいるか確認する。

---

### 8.7 確認チェックリスト

| 確認項目 | 期待値 |
|----------|--------|
| Root Directory | `getting_m4_mac` |
| Production Branch | `main`（または `vercel.json` があるブランチ） |
| 最新の Production デプロイ | ステータスが Ready（成功） |
| Cron Jobs | Enabled（オン） |
| Cron 一覧 | `/api/check-stock` が `0 0 * * *` で表示されている |

全部満たしていても動かない場合は、Hobby プラン側の実行遅延や未発火の可能性がある。その場合は [cron-job.org](https://cron-job.org) などで毎朝 9 時に `https://あなたのプロジェクト.vercel.app/api/check-stock` を GET で叩く運用に切り替えると確実。

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
