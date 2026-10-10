import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GEOFENCE_TASK, LOCATION_TASK, MAX_ACCURACY_M } from './lib/constants';
import { addPoints, getActiveTrip } from './lib/db';
import { startRecording, stopRecording } from './lib/tracking';

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
    if (!active) await startRecording(region.identifier ?? 'auto');
  } else if (eventType === Location.LocationGeofencingEventType.Enter) {
    // 手動で開始した走行は自動では止めない
    if (active && active.origin !== 'manual') await stopRecording(true);
  }
});
