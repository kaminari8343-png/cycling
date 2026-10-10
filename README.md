# Commute Ride

自宅⇔会社の自転車通勤をバックグラウンドで自動記録する Expo (React Native) アプリ。

## 機能
- **自動記録**: 自宅/会社のジオフェンス(半径150m)を出ると記録開始、入ると停止・保存。200m未満は誤検知として破棄
- **手動記録**: 開始/停止ボタン
- **履歴と統計**: 走行一覧、今週/今月の距離・回数・平均速度
- **ルート表示**: 走行ごとに地図へ軌跡を描画
- データは端末内 (SQLite) のみに保存

## 開発
バックグラウンド位置情報は Expo Go では動かないため、開発ビルドが必要です。

```bash
npm install
npx expo run:android   # または run:ios (要 macOS)
```

- Android の地図表示には Google Maps API キーが必要です (`app.json` の `android.config.googleMaps.apiKey`)
- 初回は設定タブで自宅・会社の現在地を登録し、位置情報を「常に許可」にしてください
