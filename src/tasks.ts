import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GEOFENCE_TASK, LOCATION_TASK, MAX_ACCURACY_M } from './lib/constants';
import { addPoints, getActiveTrip } from './lib/db';
import { avgSpeedKmh, formatDistance, formatDuration } from './lib/format';
import { notify } from './lib/notify';
import { placeLabel, startRecording, stopRecording } from './lib/tracking';

// 位置情報の更新: 記録中の走行に点を追加する
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  LOCATION_TASK,
  async ({ data, error }) => {
    if (error || !data) return;
    const trip = getActiveTrip();
    if (!trip) return;
    const pts = data.locations
      .filter((l) => (l.coords.accuracy ?? Infinity) <= MAX_ACCURACY_M)
      .map((l) => ({
        ts: l.timestamp,
        latitude: l.coords.latitude,
        longitude: l.coords.longitude,
        accuracy: l.coords.accuracy,
      }));
    if (pts.length > 0) addPoints(trip.id, pts);
  },
);

// ジオフェンス: 自宅/会社から出たら記録開始、入ったら記録終了
TaskManager.defineTask<{
  eventType: Location.LocationGeofencingEventType;
  region: Location.LocationRegion;
}>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { eventType, region } = data;
  const active = getActiveTrip();
  if (eventType === Location.LocationGeofencingEventType.Exit) {
    if (!active) {
      const origin = region.identifier ?? 'auto';
      await startRecording(origin);
      await notify('出発', `${placeLabel(origin)}を出発しました。記録を開始します`);
    }
  } else if (eventType === Location.LocationGeofencingEventType.Enter) {
    // 手動で開始した走行は自動では止めない
    if (active && active.origin !== 'manual') {
      const trip = await stopRecording(true);
      // 短すぎて破棄された走行は通知しない
      if (trip) {
        const sec = ((trip.endedAt ?? trip.startedAt) - trip.startedAt) / 1000;
        await notify(
          '到着',
          `${placeLabel(region.identifier ?? '')}に到着: ${formatDistance(trip.distanceM)} / ${formatDuration(sec)} / 平均 ${avgSpeedKmh(trip.distanceM, sec).toFixed(1)} km/h`,
        );
      }
    }
  }
});
