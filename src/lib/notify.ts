import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotifyEnabled } from './db';

const CHANNEL_ID = 'ride-events';

// アプリが前面にあるときも通知を表示する
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** 即時にローカル通知を出す。通知OFF・権限なしの場合は何もしない。失敗しても記録は止めない。 */
export async function notify(title: string, body: string) {
  try {
    if (!getNotifyEnabled()) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: '出発・到着',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // 通知の失敗でバックグラウンド処理を巻き込まない
  }
}
