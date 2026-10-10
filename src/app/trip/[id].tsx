import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { exportTripGpx } from '../../lib/gpx';
import { deleteTrip, getPoints, getTrip } from '../../lib/db';
import { avgSpeedKmh, formatDateTime, formatDistance, formatDuration } from '../../lib/format';
import { colors, s } from '../../lib/ui';

const MAX_POLY_POINTS = 800;

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const trip = useMemo(() => getTrip(tripId), [tripId]);
  const coords = useMemo(() => {
    const pts = getPoints(tripId);
    const step = Math.max(1, Math.ceil(pts.length / MAX_POLY_POINTS));
    return pts
      .filter((_, i) => i % step === 0 || i === pts.length - 1)
      .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  }, [tripId]);
  const map = useRef<MapView>(null);

  useEffect(() => {
    if (coords.length > 1) {
      map.current?.fitToCoordinates(coords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      });
    }
  }, [coords]);

  if (!trip) return <Text style={s.sub}>走行が見つかりません</Text>;

  const dur = ((trip.endedAt ?? trip.startedAt) - trip.startedAt) / 1000;

  const confirmDelete = () =>
    Alert.alert('削除しますか?', undefined, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          deleteTrip(tripId);
          router.back();
        },
      },
    ]);

  const exportGpx = async () => {
    try {
      await exportTripGpx(trip, `Ride ${formatDateTime(trip.startedAt)}`);
    } catch (e) {
      Alert.alert('書き出せませんでした', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={s.screen}>
      <Stack.Screen options={{ title: formatDateTime(trip.startedAt) }} />
      <MapView
        ref={map}
        style={{ flex: 1 }}
        initialRegion={
          coords[0] && { ...coords[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
      >
        <Polyline coordinates={coords} strokeColor={colors.primary} strokeWidth={5} />
      </MapView>
      <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={s.pad}>
        <View style={[s.card, s.row]}>
          <Text style={s.text}>{formatDistance(trip.distanceM)}</Text>
          <Text style={s.text}>{formatDuration(dur)}</Text>
          <Text style={s.text}>{avgSpeedKmh(trip.distanceM, dur).toFixed(1)} km/h</Text>
        </View>
        <Pressable style={s.button} onPress={exportGpx}>
          <Text style={s.buttonText}>GPXで書き出す</Text>
        </Pressable>
        <Pressable onPress={confirmDelete}>
          <Text style={{ color: colors.danger, textAlign: 'center' }}>この走行を削除</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
