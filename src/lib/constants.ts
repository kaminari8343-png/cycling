export const LOCATION_TASK = 'cycling-location-task';
export const GEOFENCE_TASK = 'cycling-geofence-task';

export type PlaceId = 'home' | 'work';
export const PLACE_LABEL: Record<PlaceId, string> = { home: '自宅', work: '会社' };

/** ジオフェンス半径 (m) */
export const GEOFENCE_RADIUS_M = 150;
/** これ未満の走行は誤検知とみなして破棄 (m) */
export const MIN_TRIP_DISTANCE_M = 200;
/** 精度がこれより悪い GPS 点は無視 (m) */
export const MAX_ACCURACY_M = 50;
