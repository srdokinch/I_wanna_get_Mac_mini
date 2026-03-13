# Step 1 解説 📖 layout.js と page.js

> **一言でいうと**  
> `layout.js` = 全ページ共通の「外枠」🖼️  
> `page.js` = そのURLの「中身」📄

---

## 🧭 App Router って何？

Next.js 13 以降の「ページの作り方」のルールです。

| 昔 (Pages Router) | 今 (App Router) |
|-------------------|-----------------|
| `pages/index.js` → `/` | `app/page.js` → `/` |
| ファイル名がそのままURL | フォルダ名がURL、中に `page.js` |

このプロジェクトは **App Router** を使っています。

```
app/
├── layout.js   ← 全ページ共通の土台（必ず1つ）
└── page.js     ← 「/」のときの表示内容
```

**イメージ**: レイアウト（外枠）＋ ページ（中身）＝ 1枚の画面 ✨

---

## 📁 layout.js の中身

**役割**: 共通の `<html>` / `<body>`、フォント、タイトルなどを定義。`{children}` のところに各ページの中身がはまります。

### 📥 インポート
- `localFont` … プロジェクト内のフォントを読み込む
- `./globals.css` … 全体のスタイル（Tailwind など）

### 🔤 フォント設定
- `geistSans` / `geistMono` を CSS 変数として定義
- `body` の className で有効にすると、子要素でも使える

### 📌 メタデータ（metadata）
```javascript
export const metadata = {
  title: "Apple整備品 在庫通知",
  description: "M4 Mac miniが入荷したら…",
};
```
- **メタデータ** = 画面上には出ない「このページの説明」の情報
- `title` → ブラウザのタブ・検索結果のタイトル
- `description` → 検索結果の説明文や SNS シェア時の説明
- **ポイント**: `metadata` を export するだけで、Next.js が自動で `<title>` や `<meta>` を出力してくれる 🎉

### 🧩 RootLayout と `{ children }`
```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}  {/* ← ここに page.js の中身が入る */}
      </body>
    </html>
  );
}
```

| 部分 | 意味 |
|------|------|
| `export default` | このファイルの「メイン」として Next.js に渡す |
| `RootLayout` | コンポーネントの名前 |
| `{ children }` | Next.js が渡してくれる「今のページの中身」。分割代入で受け取っている |


---

## 📄 page.js の中身

**役割**: トップ（`/`）に表示する内容だけを返す。`layout.js` の `{children}` にこの戻り値がはめ込まれる。

### 構造のイメージ
```
外側の div … 画面いっぱい・中央寄せ・薄グレー背景
  └─ 内側の div … 白いカード（角丸・影）
        ├─ h1 … 🍎 Apple整備品 在庫通知
        ├─ p  … 説明文（2行）
        └─ div … 「LINEで通知を受け取る 🔔」のブロック
```

---

## ✅ まとめ

| ファイル | 役割 |
|----------|------|
| **layout.js** | 共通の土台・メタデータ・`{children}` で中身をはめ込む |
| **page.js** | 「/」の表示内容を Tailwind で組み立てる |

**App Router** = `app/` の下の `layout.js` と `page.js` で「外枠＋中身」を組み合わせて1ページになる仕組みです 🚀
