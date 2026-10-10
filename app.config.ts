import { ConfigContext, ExpoConfig } from 'expo/config';

// app.json をベースに、Google Maps の API キーを環境変数から注入する。
// ローカル: GOOGLE_MAPS_API_KEY=... npx expo run:android
// EAS: `eas env:create` で GOOGLE_MAPS_API_KEY を登録
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
});
