# check-stock と LINE 通知の仕組み（初学者向け）

このドキュメントでは、**「cron-job.org から `/api/check-stock` を叩くと `reached: true` なのに LINE が来なかった問題」**と、**コードをどう直したか**を、実際のコードを交えながら説明します。

---

## 1. このプロジェクトでやっていること（ざっくり）

1. **`/api/check-stock`**  
   Apple の整備品ページに「たどり着けたか」を調べる。  
   たどり着けた（`reached: true`）ときだけ、**あなたに LINE で知らせたい**。

2. **`/api/notify`**  
   LINE の Messaging API を使って、**プッシュ通知を送る**ための API。  
   ブラウザで開いてテストしたり、別の処理から呼んだりする想定。

3. **cron-job.org / Vercel Cron**  
   毎朝など、決まった時間に **`https://（あなたのサイト）/api/check-stock`** にアクセスする。  
   ＝「定期実行のきっかけ」。

---

## 2. 用語のおさらい（初学者向け）

| 用語 | 意味 |
|------|------|
| **API ルート** | Next.js の `app/api/〇〇/route.js` のこと。URL の `/api/〇〇` に対応するプログラム。 |
| **`fetch`** | JavaScript で「別の URL に HTTP リクエストを送る」関数。ブラウザでもサーバーでも使える。 |
| **`GET`** | 主に「データを取りに行く」HTTP メソッド。ブラウザのアドレスバーで開くのはだいたい GET。 |
| **`POST`** | 主に「データを送る」HTTP メソッド。JSON を body に載せて送ることが多い。 |
| **サーバーレス** | Vercel が「リクエストが来たときだけ」プログラムを短時間動かす方式。`check-stock` もその一つ。 |
| **環境変数** | `LINE_CHANNEL_ACCESS_TOKEN` など、秘密情報をコードに直書きせず設定する値。 |

---

## 3. 以前のコードがやっていたこと

### 3.1 流れ（文章）

1. 誰かが **`GET /api/check-stock`** を叩む（cron-job.org など）。
2. プログラムが **Apple の URL** に `fetch` する。
3. 結果が「ページにたどり着けた」なら **`reached: true`**。
4. **`reached: true` のとき**、プログラムが **もう一度 `fetch`** して、  
   **`https://自分のサイトのドメイン/api/notify`** に **POST** していた。
5. 最後に **`{"reached": true}`** などの JSON を返す。

つまり **1 回のリクエストの処理の中で**、

- ① Apple へ通信  
- ② **自分の同じサイトの `/api/notify` へ通信**  

の **2 段階** になっていました。

### 3.2 以前のコード（イメージ）

実際にデプロイされていた頃のイメージは次のような形です（※現在のリポジトリにはもうありません）。

```javascript
// 以前の check-stock（概念）
if (result.reached) {
  const host = request.headers.get("host") || "";
  const baseUrl = host ? `https://${host}` : /* 省略 */;
  await fetch(`${baseUrl}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Mac miniのページが存在しているぞ👩‍💻" }),
  });
}

return Response.json({
  reached: result.reached,
  // …notify が成功したかどうかは含めていなかった
});
```

### 3.3 ここにあった問題（3つ）

#### 問題 A: `fetch` は「失敗しても例外にならない」ことがある

`fetch` は、

- **ネットワークが完全に切れた**など → `catch` に飛ぶこともある  
- **サーバーが 400 や 500 を返した** → **例外にはならず**、返ってきた `Response` の `status` が 400 などになる  

という動きをします。

以前のコードは **`/api/notify` のレスポンスの中身（`res.ok` など）を見ていなかった**ので、

- LINE が送れず `/api/notify` が **400** を返していても  
- **`await fetch(...)` は「完了」してしまい**  
- 最後は普通に **`{"reached": true}`** を返せました。

**外から見ると「API は成功しているのに LINE だけ来ない」** という状態になります。

#### 問題 B: 自分のサイトにもう一度 HTTP で叩く（自己呼び出し）

Vercel 上で動いている **`check-stock` の関数**が、インターネット経由で

`https://i-wanna-get-mac-mini.vercel.app/api/notify`

のように **同じプロジェクトの別 API をもう一度呼ぶ** 形でした。

これはよくあるパターンですが、

- タイムアウト  
- ルーティングやリージョンの都合  
- コールドスタートが 2 回続く  

などで、**環境によっては 2 本目だけ不安定**になることがあります。  
（「ブラウザから直接 `/api/notify` を開いたら動く」のに、「`check-stock` の中から `fetch` すると動かない」という差が出る、という説明もつきます。）

#### 問題 C: レスポンスに「LINE が送れたか」が載っていなかった

cron-job.org は **HTTP のステータスと本文** しか見ません。  
本文が **`{"reached":true}`** だけだと、**「LINE は送れたのか送れてないのか」が JSON からは分かりません**でした。

---

## 4. 変更後の方針（1 行で）

**`/api/notify` に `fetch` せず、同じサーバー上の関数として LINE 送信処理を直接呼ぶ。**  
その処理は **`src/lib/linePush.js`** にまとめ、`check-stock` と `notify` の両方から使う。

---

## 5. 新しく追加した `src/lib/linePush.js`

**「LINE に送る」だけを担当するファイル**です。HTTP の `/api/notify` を経由しません。

```1:41:getting_m4_mac/src/lib/linePush.js
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

export const DEFAULT_LINE_MESSAGE =
  "Mac miniのページが存在しているぞ👩‍💻";

/**
 * LINE Messaging API でプッシュメッセージを送る（HTTP ルートを経由しない）。
 * check-stock から直接呼ぶことで、同一デプロイへの fetch が失敗しても通知できる。
 *
 * @param {string} [message]
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function pushLineNotify(message = DEFAULT_LINE_MESSAGE) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { sent: false, error: "LINE_CHANNEL_ACCESS_TOKEN が設定されていません" };
  }
  const userId = process.env.LINE_USER_ID;
  if (!userId) {
    return { sent: false, error: "LINE_USER_ID が設定されていません" };
  }

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

  if (!res.ok) {
    const text = await res.text();
    return { sent: false, error: `LINE API error: ${res.status} ${text}` };
  }

  return { sent: true };
}
```

### 読み方のポイント

- **`pushLineNotify`** … 成功なら `{ sent: true }`、失敗なら `{ sent: false, error: "理由" }` を返す。  
- **`fetch` は LINE の公式 API（`api.line.me`）に対してだけ**使う。  
- 自分の Vercel の URL には **一切 `fetch` しない**。

---

## 6. 変更後の `src/app/api/check-stock/route.js`（重要部分）

ファイル先頭では `@/lib/linePush` を読み込み、Apple チェック用の関数のあとに `GET` が続きます。  
**LINE まわりは `GET` の中だけ**見れば十分です。

```36:70:getting_m4_mac/src/app/api/check-stock/route.js
export async function GET(request) {
  try {
    // cron がどの URL（Host）で叩いたか確認用（Vercel Logs に表示される）
    const host = request.headers.get("host") || "(none)";
    const url = request.url || "(none)";
    console.log("[check-stock] invoked", { host, url });

    const result = await checkMacMiniPageReachable();

    let notifyResult;
    if (result.reached) {
      // 以前は /api/notify へ fetch していたが、同一デプロイへの内部 HTTP が
      // 環境によっては届かず LINE が送られないことがあったため、直接 LINE API を呼ぶ。
      notifyResult = await pushLineNotify(DEFAULT_LINE_MESSAGE);
      if (!notifyResult.sent) {
        console.error("[check-stock] LINE notify failed", notifyResult.error);
      } else {
        console.log("[check-stock] LINE notify ok");
      }
    }

    return Response.json({
      reached: result.reached,
      redirected: result.redirected || undefined,
      error: result.error || undefined,
      ...(notifyResult !== undefined && {
        notify: notifyResult.sent ? { sent: true } : { sent: false, error: notifyResult.error },
      }),
    });
  } catch (e) {
    return Response.json(
      { reached: false, error: e.message },
      { status: 500 }
    );
  }
}
```

### 以前との違い

| 項目 | 以前 | 現在 |
|------|------|------|
| LINE までの経路 | `fetch(自分のサイト/api/notify)` | `pushLineNotify()` を**直接呼ぶ** |
| 失敗の見える化 | ほぼなし | `console.error` と JSON の **`notify`** |
| 外部サービスが分かること | `reached` だけ | `reached` に加え **`notify.sent` / `notify.error`** |

### `notify` フィールドの例

`reached: true` のとき、本文に次のような情報が付きます。

**LINE 送信に成功した場合:**

```json
{
  "reached": true,
  "notify": { "sent": true }
}
```

**LINE 送信に失敗した場合（トークン切れなど）:**

```json
{
  "reached": true,
  "notify": {
    "sent": false,
    "error": "LINE API error: 401 ..."
  }
}
```

cron-job.org の「レスポンス本文」を見れば、**LINE まで届いたか**が分かります。

---

## 7. `src/app/api/notify/route.js` の役割（変更後）

**ブラウザや Postman で「とりあえず LINE を送りたい」**とき用の API はそのまま残しています。  
中身だけ **`pushLineNotify` を呼ぶ**ようにしました（ロジックの重複をやめるため）。

```1:41:getting_m4_mac/src/app/api/notify/route.js
import {
  pushLineNotify,
  DEFAULT_LINE_MESSAGE,
} from "@/lib/linePush";

export async function GET() {
  return handleNotify(DEFAULT_LINE_MESSAGE);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body.message || DEFAULT_LINE_MESSAGE;
    return handleNotify(message);
  } catch (e) {
    return Response.json(
      { ok: false, sent: false, error: e.message },
      { status: 500 }
    );
  }
}

async function handleNotify(message) {
  try {
    const result = await pushLineNotify(message);

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

- **`GET /api/notify`** … 固定メッセージで送信テスト。  
- **`POST /api/notify`** … JSON で `message` を指定可能。  
- どちらも **最終的には `pushLineNotify` と同じ処理**。

---

## 8. 全体の流れ（変更後）の図

```
[cron-job.org など]
        │
        │  GET /api/check-stock
        ▼
┌───────────────────────────────┐
│  check-stock（1つの関数）      │
│  1. Apple に fetch            │
│  2. reached なら              │
│     pushLineNotify() を呼ぶ    │───► LINE の api.line.me へ fetch
│  3. JSON で reached + notify  │
└───────────────────────────────┘
```

**自分の `/api/notify` を HTTP で挟まない**ので、以前あった「2 本目の HTTP が不安定」というリスクを避けやすくなります。

---

## 9. まとめ（原因と対策）

| 疑われたこと | 説明 |
|--------------|------|
| cron-job.org が間違った URL を叩いている | テストで `200` と `{"reached":true}` が返っているので、**check-stock 自体は正しく動いていた**。 |
| LINE のトークンが完全に死んでいる | 修正後に LINE が届いたので、**主因はトークン単体ではなさそう**。 |
| **check-stock 内の `/api/notify` への `fetch` が期待どおりでなかった** | **結果を検証していなかった**ため外から見えず、**自己呼び出しの不安定さ**とも相性が悪かった。**対策として `pushLineNotify` に一本化した。** |

初学者向けの一言:

> **「同じアプリの別 API に、もう一度インターネット経由でお願いする」のをやめて、「同じプログラムの中で関数を呼ぶ」ようにした。**  
> あわせて **「LINE が送れたか」を JSON とログで見えるようにした。**

---

## 10. 関連ファイル一覧

| ファイル | 役割 |
|----------|------|
| `src/lib/linePush.js` | LINE 送信の中核。`pushLineNotify` |
| `src/app/api/check-stock/route.js` | 在庫（到達）チェック → 必要なら `pushLineNotify` |
| `src/app/api/notify/route.js` | 手動テスト用。内部で `pushLineNotify` |
| `docs/check-stock-line-notify-explained.md` | 本ドキュメント |

---

## 11. `@/` インポートについて

`import ... from "@/lib/linePush"` の `@/` は、`jsconfig.json` で **`./src` に対応**するように設定されています。  
`@/lib/linePush` ＝ `src/lib/linePush.js` を指します。
