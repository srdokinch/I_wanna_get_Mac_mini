# Step 3 在庫チェック 手順 📋

`/api/check-stock` で Apple 整備品ページをスクレイピングし、M4 Mac mini の在庫があるか判定する。

---

## 手順の流れ

```
① API ルートのファイルを作る
   └─ app/api/check-stock/route.js

② Apple の整備品ページの HTML を取得する
   └─ fetch(整備品 Mac mini の URL)

③ HTML を解析して「M4 Mac mini」が在庫にあるか判定する
   └─ 商品リンク（/jp/shop/product/...）に「M4」が含まれるか
   └─ またはページ内テキストで「M4」＋「Mac mini」が近くにあるか

④ 結果を返す（在庫あり / なし）
   └─ 後で「在庫あり → /api/notify を呼ぶ」を追加する
```

---

## 1. API ルートの場所（Next.js App Router）

| パス | 役割 |
|------|------|
| `src/app/api/check-stock/route.js` | GET でアクセスすると在庫チェックが実行される |

`route.js` では **GET** または **POST** を export する。Cron からは GET で叩く想定。

---

## 2. 取得する URL

- **Mac mini 整備品ページ**:  
  `https://www.apple.com/jp/shop/refurbished/mac/mac-mini`

---

## 3. 在庫判定の考え方

- Apple の整備品ページには、在庫がある商品へのリンクが並ぶ。
- リンクの URL や周辺テキストに **「M4」** と **「mac-mini」**（または Mac mini）が含まれていれば、M4 Mac mini が在庫にあるとみなす。
- 例: `/jp/shop/product/xxxxx/...Mac-mini...M4...` のようなリンクを探す。

---

## 4. 実装時のポイント

| 項目 | 内容 |
|------|------|
| **User-Agent** | `fetch` するときにヘッダーを付けると、ブロックされにくいことがある。 |
| **エラー処理** | ネットエラーや HTML が取れないときは「判定できない」として返す。 |
| **前回状態との比較** | 要件では「前回の状態と比較」とあるが、まずは「今回の在庫あり/なし」を返すところまで実装。比較・通知は Step 4 以降で追加可能。 |

---

## 5. 動作確認のしかた

1. 開発サーバーを起動: `npm run dev`
2. ブラウザまたは curl でアクセス:  
   `http://localhost:3000/api/check-stock`
3. レスポンスで `inStock: true` / `inStock: false` やメッセージを確認する。

---

## 次のステップ（Step 4 以降）

- 在庫ありのときに `/api/notify` を呼んで LINE に通知する
- 前回「在庫なし」→ 今回「在庫あり」のときだけ通知する（重複通知を防ぐ）
