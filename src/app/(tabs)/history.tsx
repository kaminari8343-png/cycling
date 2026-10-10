import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { listTrips, Trip } from '../../lib/db';
import { avgSpeedKmh, formatDateTime, formatDistance, formatDuration } from '../../lib/format';
import { placeLabel } from '../../lib/tracking';
import { s } from '../../lib/ui';

const durationOf = (t: Trip) => ((t.endedAt ?? t.startedAt) - t.startedAt) / 1000;

function summarize(trips: Trip[]) {
  const dist = trips.reduce((a, t) => a + t.distanceM, 0);
  const dur = trips.reduce((a, t) => a + durationOf(t), 0);
  return { count: trips.length, dist, avg: avgSpeedKmh(dist, dur) };
}

export default function HistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useFocusEffect(useCallback(() => setTrips(listTrips()), []));

  const { week, month } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime(); // 月曜始まり
    return {
      week: summarize(trips.filter((t) => t.startedAt >= weekStart)),
      month: summarize(trips.filter((t) => t.startedAt >= monthStart)),
    };
  }, [trips]);

  const Stat = ({ label, v }: { label: string; v: ReturnType<typeof summarize> }) => (
    <View style={[s.card, { flex: 1 }]}>
      <Text style={s.title}>{label}</Text>
      <Text style={[s.text, { fontWeight: '700' }]}>{formatDistance(v.dist)}</Text>
      <Text style={s.sub}>{v.count}回 / 平均 {v.avg.toFixed(1)} km/h</Text>
    </View>
  );

  return (
    <FlatList
      style={s.screen}
      contentContainerStyle={s.pad}
      data={trips}
      keyExtractor={(t) => String(t.id)}
      ListHeaderComponent={
        <View style={[s.row, { gap: 12, marginBottom: 4 }]}>
          <Stat label="今週" v={week} />
          <Stat label="今月" v={month} />
        </View>
      }
      ListEmptyComponent={<Text style={s.sub}>まだ走行がありません</Text>}
      renderItem={({ item }) => (
        <Pressable style={s.card} onPress={() => router.push(`/trip/${item.id}`)}>
          <View style={s.row}>
            <Text style={s.text}>{formatDateTime(item.startedAt)}</Text>
            <Text style={[s.text, { fontWeight: '700' }]}>{formatDistance(item.distanceM)}</Text>
          </View>
          <Text style={s.sub}>
            {item.origin === 'manual' ? '手動' : `${placeLabel(item.origin)}から`} ・{' '}
            {formatDuration(durationOf(item))} ・{' '}
            {avgSpeedKmh(item.distanceM, durationOf(item)).toFixed(1)} km/h
          </Text>
        </Pressable>
      )}
    />
  );
}
