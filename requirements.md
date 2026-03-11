# Apple整備品 在庫通知アプリ 要件まとめ

## 概要

Appleの整備品ストアにM4 Mac miniが入荷した瞬間に、LINEで通知を受け取るWebアプリ。

---

## やりたいこと

- Apple整備品ストアのM4Mac miniの在庫を定期的に自動監視する
- 在庫が出たら即座にLINEで通知を受け取る
- GitHubで管理し、Webページとして世界に公開する
- 機能は最小限にしてシンプルに作る

---

## 画面イメージ

```
┌─────────────────────────────────┐
│   🍎 Apple整備品 在庫通知        │
│                                 │
│   M4 Mac miniが入荷したら        │
│   すぐにLINEでお知らせします      │
│                                 │
│   ┌─────────────────────────┐   │
│   │   LINEで通知を受け取る 🔔 │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

---

## 技術スタック

| 技術 | 役割 | 選定理由 |
|---|---|---|
| **Next.js 14** | フロント＋サーバー | API Routesでフロントもバックも1プロジェクトで完結 |
| **Vercel** | ホスティング＋Cron定期実行 | GitHubと繋ぐだけでデプロイ完了・Cronも同じ場所で管理 |
| **LINE Messaging API** | 通知送信 | LINEアプリで受け取れる・200通/月無料 |
| **Tailwind CSS** | スタイリング | クラス名だけでデザインできる |

> 個人専用のため登録ユーザー管理が不要→ DBは使わない。通知先のLINE User IDは環境変数に直接設定する。

> ⚠️ LINE Notifyは2025年3月に廃止済みのため、LINE Messaging APIを使用する

---

## アーキテクチャ

```
GitHub (コード管理)
    │
    │ pushしたら自動デプロイ
    ▼
Vercel (ホスティング)
    │
    ├─── Webページ
    │    └─ 監視中であることを示すシンプルな画面
    │
    ├─── /api/check-stock  ← Cronで30分ごとに自動実行
    │    ├─ AppleのJSON APIからM4 Mac miniの在庫を取得
    │    ├─ 前回の状態と比較（環境変数で管理）
    │    ├─ 変化あり → /api/notifyを呼ぶ
    │    └─ 変化なし → 何もしない
    │
    └─── /api/notify
         └─ LINE Messaging APIに通知をPOST → LINEに届く 📱
```

---

## 在庫データの取得方法

スクレイピング（HTMLを解析）よりも、**AppleがページをロードするときにAppleが内部で使っているJSON APIを直接叩く**方法を優先する。

```
取得方法の優先順位

1位: AppleのJSON APIを直接叩く（fetch のみで実装できる・シンプル）
2位: HTMLスクレイピング（APIが見つからない場合の保険）

確認方法:
  ① Appleの整備品ページを開く
     https://www.apple.com/jp/shop/refurbished/mac/mac-mini
  ② DevTools → Networkタブ → Fetch/XHRでフィルタ
  ③ JSONを返しているリクエストを特定する
```

---

## スクレイピングの法的観点

| 項目 | 今回のケース |
|---|---|
| 個人利用 | ✅ |
| アクセス頻度 | ✅ 30分に1回（常識的な範囲）|
| データの商用利用 | ✅ しない |
| ログイン不要ページ | ✅ |

→ **個人利用の範囲であり現実的に問題ないレベル。** RefurbMeのような商用サービスでさえ同様の手法で長期間稼働している実績がある。

---

## 実装ステップ

```
Step 1　環境構築（約30分）
    └─ Next.jsプロジェクト作成
    └─ GitHubにpush
    └─ Vercelと連携

Step 2　画面作成（約30分）
    └─ 監視中を示すシンプルな画面をTailwindで作成

Step 3　在庫チェック（約1〜2時間）
    └─ DevToolsでAppleのJSON APIを特定
    └─ /api/check-stock を実装

Step 4　LINE通知（約30分）
    └─ LINE Developersでチャンネル作成
    └─ アクセストークン・User IDを取得
    └─ /api/notify を実装

Step 5　Cron設定＆デプロイ（約30分）
    └─ vercel.jsonにCron設定（30分ごと）
    └─ GitHubにpushして完成 🎉

合計目安: 3〜4時間
```

---

## LINE Messaging API 事前準備

メール通知と比べて以下の手順が追加になる。

```
① LINE Developersでアカウント作成
      ↓
② 「Messaging APIチャンネル」を新規作成
      ↓
③ チャンネルアクセストークンを取得
      ↓
④ 自分のLINE User IDを取得
      ↓
⑤ トークンをVercelの環境変数に設定
```

---

## 参考サイト

- [RefurbMe](https://www.refurb.me/en-jp) - 同様のサービスの完成形。複数ショップを横断して比較・通知する商用サービス。今回作るものの参考になる。
