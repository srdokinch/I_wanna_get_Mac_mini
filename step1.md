# Step 1 解説: layout.js と page.js

Next.js の App Router では、`layout.js` が「全ページ共通の土台」、`page.js` が「そのURLの画面の中身」を担当します。

---

## App Router とは（初心者向け）

**App Router** は、Next.js 13 以降で使える「ページの作り方」のルールです。

### 従来の Pages Router との違い

- **Pages Router（昔のやり方）**: `pages/` フォルダに `index.js` や `about.js` を置くと、そのファイル名がそのまま URL になる（`/` や `/about`）。
- **App Router（今のやり方）**: `app/` フォルダの中に、**フォルダ名がURL** になり、その中に `page.js` を置くと「そのURLの画面」になります。

このプロジェクトでは **App Router** を使っています。`app/` の下に `page.js` があるので、トップページ（`/`）の内容は `app/page.js` で決まります。

### フォルダ＝URL、page.js＝画面の中身

```
app/
  layout.js   ← 全ページで共通の「外枠」（ヘッダー・フッター・<html> など）
  page.js     ← 「/」のときの中身
```

- **layout.js**: すべてのページで共通して使う部分。`<html>` や `<body>`、共通のヘッダーなどを書く。**必ず1つ**必要。
- **page.js**: そのURLで表示したい「中身」だけを書く。`layout.js` で用意した `{children}` のところに、この中身がはめ込まれるイメージです。

つまり「レイアウト（外枠）＋ ページ（中身）」で1枚の画面ができています。まずはこの2つの役割の違いを押さえておくと、後述の `metadata` や `children` の説明も理解しやすくなります。

---

## layout.js の役割と中身

**役割**: すべてのページで共通する HTML の骨組みとメタ情報を定義します。ルートの `app/layout.js` は必ず存在し、`{children}` の部分に各ページの内容が入ります。

### 1. インポート

```javascript
import localFont from "next/font/local";
import "./globals.css";
```

- **localFont**: Next.js のフォント機能。プロジェクト内の `.woff` を読み込み、クラス名で使えるようにする。
- **globals.css**: 全体に効かせるスタイル（Tailwind のベースやカスタムCSS）。

### 2. フォント設定

```javascript
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({ ... });
```

- `src`: フォントファイルのパス。
- `variable`: CSS 変数名。ここで `--font-geist-sans` などが定義され、`body` の `className` で有効になる。
- `weight`: 利用する字太さの範囲（100〜900）。

`body` に `${geistSans.variable} ${geistMono.variable}` を付けることで、子要素でこのフォントを参照できます。

### 3. メタデータ（metadata）

```javascript
export const metadata = {
  title: "Apple整備品 在庫通知",
  description: "M4 Mac miniが入荷したらすぐにLINEでお知らせします",
};
```

- **title**: ブラウザのタブや検索結果に使われるタイトル。
- **description**: 検索結果の説明文や OGP で使われることがある。

通常の HTML では、自分で `<head>` 内に `<title>...</title>` や `<meta name="description" content="...">` を書く必要があります。**App Router では、`metadata` というオブジェクトを export するだけで、Next.js が自動でそれらを `<head>` に出力してくれます。** どのページでも同じタイトル・説明にしたい場合は、このルートの `layout.js` に書いておけば、全ページに反映されます。

### 4. RootLayout コンポーネント

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**この1行の意味を分解すると次のとおりです。**

| 部分 | 意味 |
|------|------|
| **export default** | 「このファイルの“メイン”として外に渡す」という宣言。Next.js は `layout.js` を読み込むとき、**default で export されているもの**をレイアウトとして使います。 |
| **function RootLayout** | 関数の名前。レイアウト用のコンポーネントなので `RootLayout` という名前がよく使われます。 |
| **({ children })** | この関数が受け取る**引数**です。Next.js が「今表示したいページの中身」を **children** という名前で渡してくれます。`{ children }` は「渡されたオブジェクトから `children` だけを取り出す」という JavaScript の**分割代入**の書き方です。 |

つまり、「`RootLayout` というコンポーネントを default で export し、Next.js から渡される `children`（ページの中身）を受け取って、`<html>` と `<body>` で囲んだ中に `{children}` として表示する」という意味になります。

- **children**: そのレイアウトの「中身」。トップページなら `page.js` の内容が入る。
- **lang="ja"**: 日本語ページであることを示す。
- **className**: フォント用の CSS 変数と、`antialiased`（文字の滑らか表示）を指定。

---

## page.js の役割と中身

**役割**: トップページ（`/`）に表示する内容だけを返すコンポーネントです。`layout.js` の `{children}` の位置にこの戻り値が入ります。

### 1. デフォルト export

```javascript
export default function Home() {
  return ( ... );
}
```

- `app/page.js` は「/」に対応するページ。
- デフォルト export したコンポーネントが、そのURLの「中身」として描画される。

### 2. 外側の div（画面全体）

```javascript
<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
```

| クラス | 意味 |
|--------|------|
| `min-h-screen` | 高さを最低でも画面いっぱいにする |
| `bg-gray-50` | 背景を薄いグレーに |
| `flex flex-col` | 縦方向に flex |
| `items-center justify-center` | 子要素を中央寄せ |
| `p-6` | 周囲に余白 |

→ 画面中央にコンテンツを置くためのラッパーです。

### 3. 内側の div（白いカード）

```javascript
<div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
```

| クラス | 意味 |
|--------|------|
| `max-w-md` | 幅の最大値を「medium」に制限 |
| `w-full` | 親の幅いっぱい（max-w-md まで） |
| `bg-white` | 白背景 |
| `rounded-2xl` | 角を大きく丸める |
| `shadow-lg` | 大きめの影 |
| `p-8` | 内側の余白 |
| `text-center` | 文字を中央寄せ |

→ カード状のブロックを作っています。

### 4. 見出し（h1）

```javascript
<h1 className="text-2xl font-bold text-gray-900 mb-2">
  🍎 Apple整備品 在庫通知
</h1>
```

- フォントサイズ・太字・色・下マージンを Tailwind で指定。

### 5. 説明文（p）

```javascript
<p className="text-gray-600 mb-8 leading-relaxed">
  M4 Mac miniが入荷したら
  <br />
  すぐにLINEでお知らせします
</p>
```

- `leading-relaxed`: 行の高さをゆったりに。
- `<br />` で 2 行に分割。

### 6. 「LINEで通知を受け取る」のブロック

```javascript
<div className="rounded-xl bg-gray-100 py-4 px-6 text-gray-700 font-medium">
  LINEで通知を受け取る 🔔
</div>
```

- ボタン風の見た目だが、現状は `<div>` なのでクリック処理はなし。
- 後からリンクやボタンに変更しやすいように、まとまったブロックにしている。

---

## まとめ

| ファイル | 役割 |
|----------|------|
| **layout.js** | 全ページ共通の `<html>` / `<body>`、フォント、メタデータを定義。`{children}` に各ページがはまる。 |
| **page.js** | トップページ「/」の表示内容だけを返す。Tailwind でレイアウト・見た目を指定している。 |

Next.js の App Router では、`app/` 配下の `layout.js` と `page.js` の組み合わせで「共通レイアウト ＋ ページごとの内容」ができています。
