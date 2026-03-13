# Step 3 在庫チェック 手順 📋

`/api/check-stock` で **mac-mini ページにリダイレクトなしでたどり着けたか** だけを判定する。スクレイピングは行わない。

---

## 手順の流れ

```
① API ルート
   └─ src/app/api/check-stock/route.js

② mac-mini の URL に fetch（redirect: "manual"）
   └─ https://www.apple.com/jp/shop/refurbished/mac/mac-mini

③ ステータスだけ見る
   └─ 200 → リダイレクトなしでたどり着けた → reached: true
   └─ 301/302/307/308 → リダイレクトされた → reached: false, redirected: true
   └─ その他 → エラー（reached: false, error: "HTTP xxx"）

④ 結果を JSON で返す
```

---

## 判定の意味

| 結果 | 意味 |
|------|------|
| **reached: true** | mac-mini 専用ページにリダイレクトなしで到達できた（＝ページが「ある」状態） |
| **reached: false, redirected: true** | リダイレクトされた＝mac-mini 専用ページではなく別ページに飛ばされた |
| **reached: false, error: "HTTP xxx"** | その他の HTTP エラー |

※ 中身の HTML は取得・解析しない。ステータスコードだけを見る。

---

## 動作確認

1. `npm run dev` で開発サーバー起動
2. ブラウザで `http://localhost:3000/api/check-stock` を開く
3. レスポンス例:
   - リダイレクトされている場合: `{ "reached": false, "redirected": true, "error": "redirected" }`
   - たどり着けている場合: `{ "reached": true, "redirected": false }`

---

## 次のステップ（Step 4 以降）

- `reached: true` のときに `/api/notify` を呼んで LINE に通知する
- 必要なら前回との比較で「変化があったときだけ」通知する
