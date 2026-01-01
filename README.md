# muu-kakeibo

Supabase + Next.js で作成した家計簿アプリ。
月単位・期間指定で取引を集計・一覧表示できます。

## Features
- 取引の登録 / 編集 / 削除
- 月範囲指定（年跨ぎ対応）
- カテゴリ・メモ検索
- CSVエクスポート

## Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind CSS

## Notes
- 月の扱いは Ym 型で共通管理
- UIの途中状態と確定状態を分離して設計
