import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { MIN_DISTANCE_OPTIONS, PLACE_LABEL, PlaceId, RADIUS_OPTIONS } from '../../lib/constants';
import {
  getAutoEnabled,
  getMinDistance,
  getNotifyEnabled,
  getRadius,
  getPlace,
  Place,
  setAutoEnabled,
  setMinDistance,
  setNotifyEnabled,
  setPlace,
  setRadius,
} from '../../lib/db';
import { ensureNotificationPermission } from '../../lib/notify';
import { ensurePermissions, getCurrentPlace, syncGeofences } from '../../lib/tracking';
import { colors, s } from '../../lib/ui';

function Options({
  values,
  current,
  unit,
  onPick,
}: {
  values: number[];
  current: number;
  unit: string;
  onPick: (v: number) => void;
}) {
  return (
    <View style={[s.row, { gap: 8 }]}>
      {values.map((v) => (
        <Pressable
          key={v}
          onPress={() => onPick(v)}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: v === current ? colors.primary : 'transparent',
          }}
        >
          <Text style={{ color: v === current ? '#fff' : colors.primary }}>
            {v}
            {unit}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const [auto, setAuto] = useState(false);
  const [notif, setNotif] = useState(true);
  const [radius, setRadiusState] = useState(getRadius());
  const [minDist, setMinDistState] = useState(getMinDistance());
  const [places, setPlaces] = useState<Record<PlaceId, Place | null>>({ home: null, work: null });

  useFocusEffect(
    useCallback(() => {
      setAuto(getAutoEnabled());
      setNotif(getNotifyEnabled());
      setRadiusState(getRadius());
      setMinDistState(getMinDistance());
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

  const pickRadius = async (m: number) => {
    setRadius(m);
    setRadiusState(m);
    try {
      await syncGeofences();
    } catch (e) {
      Alert.alert('エラー', String(e));
    }
  };

  const pickMinDist = (m: number) => {
    setMinDistance(m);
    setMinDistState(m);
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
          自宅/会社の周辺を出ると記録を開始し、入ると停止して保存します。
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.text}>検知範囲(半径)</Text>
        <Options values={RADIUS_OPTIONS} current={radius} unit="m" onPick={pickRadius} />
        <Text style={s.sub}>広いほど誤検知が減りますが、出発の検知が遅れます。</Text>
        <Text style={[s.text, { marginTop: 8 }]}>これより短い走行は破棄</Text>
        <Options values={MIN_DISTANCE_OPTIONS} current={minDist} unit="m" onPick={pickMinDist} />
        <Text style={s.sub}>自宅付近のGPSのふらつきによる誤記録を防ぎます。</Text>
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
