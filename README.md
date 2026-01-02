# muu-kakeibo

Supabase + Next.js で作成した、個人利用向けの家計簿アプリです。  
取引の登録・一覧・集計をシンプルに行うことを目的としています。

## Features
- 取引の登録 / 編集 / 削除
- 月範囲指定（年跨ぎ対応）
- カテゴリ・メモ検索
- CSV エクスポート

## Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind CSS

## Notes
- 月の扱いは `Ym` 型で共通管理
- UI の「途中入力状態」と「確定表示状態」を分離した設計
- 個人利用を想定し、分析機能は最小限に留めている
