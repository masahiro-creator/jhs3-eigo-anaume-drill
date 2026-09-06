# 中学英語 空所補充ドリル

中学3年の受験生向けの、4択の空所補充問題を反復して解くWebアプリです。
「まぐれ当たりの排除」と「忘却曲線に沿った復習」の2点を仕組みで解決します。

## 技術構成

- 素のHTML / CSS / JavaScript（ESモジュール）。ビルドステップなし
- 状態管理・保存先は `localStorage` のみ。サーバー・ログインなし
- 依存パッケージなし（テストは Node.js 標準の `node:test` を使用）

## 起動方法

ビルド不要の静的サイトなので、任意の静的サーバーで配信するだけで動きます。

```bash
python3 -m http.server 8080
# ブラウザで http://localhost:8080 を開く
```

Netlify / Vercel / GitHub Pages にそのまま置けます。

## テスト

出題ロジック（`js/lib/scheduler.js`）と問題データの型チェックを、
Node.js 標準の `node:test` でテストしています。

```bash
npm test
```

## ディレクトリ構成

```
index.html
css/style.css          画面スタイル
js/
  app.js                画面遷移・状態管理・イベント処理
  data/questions.js      問題データ（73問）
  lib/
    scheduler.js          出題ロジック（純粋関数。DOMに非依存）
    storage.js            localStorage の読み書き
    validate.js           問題データの整合性チェック
    highlight.js           英文の空所表示・マーカー表示の整形
  components/
    home.js / quiz.js / stats.js / done.js   各画面のHTML生成
tests/
  scheduler.test.js       出題ロジックの単体テスト
  questions.test.js       問題データの型チェック
```
