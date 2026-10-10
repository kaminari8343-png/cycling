import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { PLACE_LABEL, PlaceId } from '../../lib/constants';
import {
  getAutoEnabled,
  getNotifyEnabled,
  getPlace,
  Place,
  setAutoEnabled,
  setNotifyEnabled,
  setPlace,
} from '../../lib/db';
import { ensureNotificationPermission } from '../../lib/notify';
import { ensurePermissions, getCurrentPlace, syncGeofences } from '../../lib/tracking';
import { colors, s } from '../../lib/ui';

export default function SettingsScreen() {
  const [auto, setAuto] = useState(false);
  const [notif, setNotif] = useState(true);
  const [places, setPlaces] = useState<Record<PlaceId, Place | null>>({ home: null, work: null });

  useFocusEffect(
    useCallback(() => {
      setAuto(getAutoEnabled());
      setNotif(getNotifyEnabled());
      setPlaces({ home: getPlace('home'), work: getPlace('work') });
    }, []),
  );

  const toggleAuto = async (on: boolean) => {
    try {
      if (on) {
        if (!places.home && !places.work) {
          Alert.alert('場所が未設定です', '先に自宅または会社の場所を登録してください。');
          return;
        }
        if (!(await ensurePermissions(true))) {
          Alert.alert('権限が必要です', '自動記録には位置情報「常に許可」が必要です。');
          return;
        }
      }
      if (on && getNotifyEnabled()) await ensureNotificationPermission();
      setAutoEnabled(on);
      setAuto(on);
      await syncGeofences();
    } catch (e) {
      Alert.alert('エラー', String(e));
    }
  };

  const toggleNotif = async (on: boolean) => {
    if (on && !(await ensureNotificationPermission())) {
      Alert.alert('権限が必要です', '通知を表示するには、設定アプリで通知を許可してください。');
      return;
    }
    setNotifyEnabled(on);
    setNotif(on);
  };

  const registerHere = async (id: PlaceId) => {
    try {
      const p = await getCurrentPlace();
      setPlace(id, p);
      setPlaces((prev) => ({ ...prev, [id]: p }));
      await syncGeofences();
    } catch (e) {
      Alert.alert('エラー', String(e));
    }
  };

  const clearPlace = async (id: PlaceId) => {
    setPlace(id, null);
    setPlaces((prev) => ({ ...prev, [id]: null }));
    await syncGeofences();
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.text}>自動記録</Text>
          <Switch value={auto} onValueChange={toggleAuto} />
        </View>
        <Text style={s.sub}>
          自宅/会社の周辺(半径150m)を出ると記録を開始し、入ると停止して保存します。200m未満の移動は破棄されます。
        </Text>
      </View>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.text}>出発・到着の通知</Text>
          <Switch value={notif} onValueChange={toggleNotif} />
        </View>
        <Text style={s.sub}>自動記録の開始時と、保存時(距離・時間・平均速度)に通知します。</Text>
      </View>
      {(['home', 'work'] as PlaceId[]).map((id) => (
        <View key={id} style={s.card}>
          <Text style={s.text}>{PLACE_LABEL[id]}</Text>
          <Text style={s.sub}>
            {places[id]
              ? `${places[id]!.latitude.toFixed(5)}, ${places[id]!.longitude.toFixed(5)}`
              : '未設定'}
          </Text>
          <View style={[s.row, { gap: 12 }]}>
            <Pressable style={[s.button, { flex: 1, paddingVertical: 12 }]} onPress={() => registerHere(id)}>
              <Text style={[s.buttonText, { fontSize: 15 }]}>現在地を登録</Text>
            </Pressable>
            {places[id] && (
              <Pressable onPress={() => clearPlace(id)}>
                <Text style={{ color: colors.danger }}>削除</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
