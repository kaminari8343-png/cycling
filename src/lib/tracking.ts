import * as Location from 'expo-location';
import {
  GEOFENCE_TASK,
  LOCATION_TASK,
  PLACE_LABEL,
  PlaceId,
} from './constants';
import {
  finishTrip,
  getActiveTrip,
  getAutoEnabled,
  getPlace,
  getRadius,
  startTrip,
  Trip,
} from './db';

export async function ensurePermissions(needBackground: boolean): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  if (!needBackground) return true;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

async function startLocationUpdates() {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 10,
    timeInterval: 5000,
    activityType: Location.ActivityType.Fitness,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: '走行を記録中',
      notificationBody: 'バックグラウンドでルートを記録しています',
      notificationColor: '#1e88e5',
    },
  });
}

/** 走行を開始する (手動・自動共通)。すでに記録中なら既存の走行を返す。 */
export async function startRecording(origin: string): Promise<Trip> {
  const trip = getActiveTrip() ?? startTrip(origin);
  await startLocationUpdates();
  return trip;
}

/** 走行を終了して保存する。discardIfShort が true なら短すぎる走行は破棄。 */
export async function stopRecording(discardIfShort = false): Promise<Trip | null> {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  const active = getActiveTrip();
  return active ? finishTrip(active.id, discardIfShort) : null;
}

/** 自宅・会社のジオフェンスを現在の設定に合わせて登録し直す。 */
export async function syncGeofences() {
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  const regions: Location.LocationRegion[] = [];
  if (getAutoEnabled()) {
    for (const id of ['home', 'work'] as PlaceId[]) {
      const p = getPlace(id);
      if (p) {
        regions.push({
          identifier: id,
          latitude: p.latitude,
          longitude: p.longitude,
          radius: getRadius(),
          notifyOnEnter: true,
          notifyOnExit: true,
        });
      }
    }
  }
  if (regions.length === 0) {
    if (running) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}

/** 現在地を取得して場所として保存するための補助 */
export async function getCurrentPlace() {
  const ok = await ensurePermissions(false);
  if (!ok) throw new Error('位置情報の権限がありません');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export const placeLabel = (id: string) => PLACE_LABEL[id as PlaceId] ?? id;
