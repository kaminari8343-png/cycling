import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { getActiveTrip, Trip } from '../../lib/db';
import { avgSpeedKmh, formatDistance, formatDuration } from '../../lib/format';
import { ensurePermissions, placeLabel, startRecording, stopRecording } from '../../lib/tracking';
import { colors, s } from '../../lib/ui';

export default function RecordScreen() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  // 画面表示中は1秒ごとにDBから最新状態を読む (記録はバックグラウンドタスクが書き込む)
  useFocusEffect(
    useCallback(() => {
      const tick = () => {
        setTrip(getActiveTrip());
        setNow(Date.now());
      };
      tick();
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    }, []),
  );

  const toggle = async () => {
    setBusy(true);
    try {
      if (trip) {
        await stopRecording(false);
      } else {
        if (!(await ensurePermissions(true))) {
          Alert.alert('権限が必要です', 'バックグラウンド記録には位置情報「常に許可」が必要です。設定アプリから変更してください。');
          return;
        }
        await startRecording('manual');
      }
      setTrip(getActiveTrip());
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setBusy(false);
    }
  };

  const durationSec = trip ? (now - trip.startedAt) / 1000 : 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={s.card}>
        <Text style={s.title}>{trip ? `記録中 (${trip.origin === 'manual' ? '手動' : `${placeLabel(trip.origin)}から自動開始`})` : '待機中'}</Text>
        <Text style={s.big}>{formatDistance(trip?.distanceM ?? 0)}</Text>
        <View style={s.row}>
          <Text style={s.text}>時間 {formatDuration(durationSec)}</Text>
          <Text style={s.text}>
            平均 {avgSpeedKmh(trip?.distanceM ?? 0, durationSec).toFixed(1)} km/h
          </Text>
        </View>
      </View>
      <Pressable
        style={[s.button, trip && { backgroundColor: colors.danger }, busy && { opacity: 0.6 }]}
        onPress={toggle}
        disabled={busy}
      >
        <Text style={s.buttonText}>{trip ? '停止して保存' : '手動で開始'}</Text>
      </Pressable>
      <Text style={s.sub}>
        自宅・会社を「設定」で登録して自動記録をONにすると、出発/到着で自動的に記録を開始・終了します。
      </Text>
    </ScrollView>
  );
}
