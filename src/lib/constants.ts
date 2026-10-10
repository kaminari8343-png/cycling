export const LOCATION_TASK = 'cycling-location-task';
export const GEOFENCE_TASK = 'cycling-geofence-task';

export type PlaceId = 'home' | 'work';
export const PLACE_LABEL: Record<PlaceId, string> = { home: '自宅', work: '会社' };

/** ジオフェンス半径 (m) の既定値と選択肢 */
export const GEOFENCE_RADIUS_M = 150;
export const RADIUS_OPTIONS = [100, 150, 200, 300];
/** これ未満の走行は誤検知とみなして破棄 (m) の既定値と選択肢 */
export const MIN_TRIP_DISTANCE_M = 200;
export const MIN_DISTANCE_OPTIONS = [100, 200, 500, 1000];
/** 精度がこれより悪い GPS 点は無視 (m) */
export const MAX_ACCURACY_M = 50;
