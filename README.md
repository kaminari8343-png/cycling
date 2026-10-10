# Commute Ride

自宅⇔会社の自転車通勤をバックグラウンドで自動記録する Expo (React Native) アプリ。

## 機能
- **自動記録**: 自宅/会社のジオフェンス(半径150m)を出ると記録開始、入ると停止・保存。200m未満は誤検知として破棄
- **手動記録**: 開始/停止ボタン
- **通知**: 自動記録の出発時と到着時(距離・時間・平均速度)にローカル通知 (設定でON/OFF)
- **履歴と統計**: 走行一覧、今週/今月の距離・回数・平均速度
- **ルート表示**: 走行ごとに地図へ軌跡を描画
- **GPX書き出し**: 走行詳細画面から GPX 1.1 を共有シート経由で保存・送信 (Strava 等に取り込み可)
- データは端末内 (SQLite) のみに保存

## 開発
バックグラウンド位置情報は Expo Go では動かないため、開発ビルドが必要です。

```bash
npm install
npx expo run:android   # または run:ios (要 macOS)
```

- Android の地図表示には Google Maps API キーが必要です。環境変数 `GOOGLE_MAPS_API_KEY` に設定します (`app.config.ts` が読み込みます)
- 初回は設定タブで自宅・会社の現在地を登録し、位置情報を「常に許可」にしてください

## EAS でビルド (クラウド)
```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # プロジェクトを紐付け (app.json に projectId が追記される)
npx eas-cli@latest env:create --name GOOGLE_MAPS_API_KEY --value <キー> --environment development --environment preview --environment production --visibility secret
npx eas-cli@latest build --profile development --platform android   # 開発ビルド (APK)
npx eas-cli@latest build --profile preview --platform android       # 社内配布用 APK
```
- `development`: 開発クライアント入り。実機で `npx expo start --dev-client` に接続
- `preview`: 通勤で日常使いする確認用ビルド (Android は APK)
- `production`: ストア提出用 (`eas submit`)
- iOS の実機ビルドには Apple Developer アカウントが必要です

## 調整できる項目 (設定タブ)
- 検知範囲(半径): 100 / 150 / 200 / 300 m
- 破棄する短い走行の距離: 100 / 200 / 500 / 1000 m
