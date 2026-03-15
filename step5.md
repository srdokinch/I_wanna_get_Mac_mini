# Step 5 Cron 設定＆デプロイ 📋

30分ごとに `/api/check-stock` を実行し、mac-mini ページにたどり着けたら LINE に通知する仕組みを本番環境で動かす。

---

## 手順の流れ

```
① vercel.json で Cron を設定（30分ごとに /api/check-stock を呼ぶ）
② （任意）check-stock で reached: true のときに /api/notify を呼ぶ処理を追加
③ GitHub に push
④ Vercel と GitHub を連携してデプロイ
⑤ Vercel の環境変数に LINE_CHANNEL_ACCESS_TOKEN と LINE_USER_ID を設定
```

---

## 1. vercel.json の Cron 設定

プロジェクト直下（`getting_m4_mac/`）に `vercel.json` を置いてある。

| 項目 | 内容 |
|------|------|
| **path** | `/api/check-stock`（この URL を定期実行する） |
| **schedule** | `*/30 * * * *` ＝ 毎時 0分・30分（30分ごと） |

※ Vercel の **Hobby（無料）プラン** では、Cron の実行回数が **1日2回まで** などの制限がある場合がある。  
  「30分ごと」にしたい場合は Pro プランが必要なことがある。制限に合わせて `schedule` を変更可能（例: 毎時なら `0 * * * *`）。

---

## 2. （任意）check-stock から notify を呼ぶ

現状は Cron が `/api/check-stock` を叩くだけ。  
「`reached: true` のときだけ LINE に通知したい」場合は、`/api/check-stock` の GET の戻りで `reached === true` のときに、同じサーバー内の `/api/notify` を `fetch` で呼ぶ処理を追加する。

- 追加する場合: `src/app/api/check-stock/route.js` の GET 内で、`result.reached === true` なら `fetch(自分のURL/api/notify)` を実行する。
- 追加しない場合: 手動で `http://localhost:3000/api/notify` を開いて通知する運用でもよい。

---

## 3. GitHub に push

```bash
cd /Users/sakagamiryouichi/Git/m4_mac
git add .
git commit -m "Add vercel.json cron for check-stock"
git push origin main
```

※ ブランチ名が `main` でない場合は適宜変更。

---

## 4. Vercel と連携してデプロイ

1. [Vercel](https://vercel.com) にログイン
2. **Add New** → **Project**
3. **Import Git Repository** で、このリポジトリ（m4_mac または getting_m4_mac を push しているリポジトリ）を選択
4. **Root Directory** が `getting_m4_mac` になるようにする（プロジェクトがリポジトリ直下ならそのまま）
5. **Deploy** でデプロイ開始

---

## 5. Vercel の環境変数を設定

1. Vercel のダッシュボードで、該当プロジェクトを開く
2. **Settings** → **Environment Variables**
3. 次を追加する：
   - **LINE_CHANNEL_ACCESS_TOKEN** ＝ チャンネルアクセストークン
   - **LINE_USER_ID** ＝ 自分の LINE User ID
4. 保存後、**Redeploy** で再デプロイすると、本番でも LINE 通知が動く

---

## 6. 動作確認

- Vercel の **Deployments** で本番 URL を確認（例: `https://xxx.vercel.app`）
- ブラウザで `https://xxx.vercel.app/api/check-stock` を開き、`reached` などが返るか確認
- Cron は本番デプロイ後に、指定したスケジュールで自動実行される（ログは Vercel の **Logs** や **Functions** で確認可能）

---

## 次のステップ（完了後）

- `reached: true` のときだけ `/api/notify` を呼ぶ処理を入れるかどうか決める
- 必要に応じて `schedule` を変更（無料プランの制限に合わせるなど）
