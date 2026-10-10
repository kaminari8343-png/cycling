import * as SQLite from 'expo-sqlite';
import { MIN_TRIP_DISTANCE_M, PlaceId } from './constants';
import { haversine } from './geo';

export type Trip = {
  id: number;
  startedAt: number;
  endedAt: number | null;
  distanceM: number;
  /** 'home' | 'work' | 'manual' */
  origin: string;
};

export type TripPoint = {
  ts: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type Place = { latitude: number; longitude: number };

let db: SQLite.SQLiteDatabase | null = null;

// フォアグラウンドとバックグラウンドタスクの両方から使うため同期APIで開く
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('cycling.db');
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        distance_m REAL NOT NULL DEFAULT 0,
        origin TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        ts INTEGER NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        accuracy REAL
      );
      CREATE INDEX IF NOT EXISTS idx_points_trip ON points(trip_id, ts);
      CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    db.execSync('PRAGMA foreign_keys = ON;');
  }
  return db;
}

type TripRow = {
  id: number;
  started_at: number;
  ended_at: number | null;
  distance_m: number;
  origin: string;
};

const toTrip = (r: TripRow): Trip => ({
  id: r.id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  distanceM: r.distance_m,
  origin: r.origin,
});

// ---- 設定 (自宅・会社の位置、自動記録のON/OFF) ----

function getKv(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
  return row?.value ?? null;
}

function setKv(key: string, value: string | null) {
  if (value === null) getDb().runSync('DELETE FROM kv WHERE key = ?', key);
  else getDb().runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
}

export function getPlace(id: PlaceId): Place | null {
  const v = getKv(`place:${id}`);
  return v ? (JSON.parse(v) as Place) : null;
}

export function setPlace(id: PlaceId, place: Place | null) {
  setKv(`place:${id}`, place ? JSON.stringify(place) : null);
}

export function getAutoEnabled(): boolean {
  return getKv('auto') === '1';
}

export function setAutoEnabled(on: boolean) {
  setKv('auto', on ? '1' : '0');
}

// ---- 走行 ----

export function getActiveTrip(): Trip | null {
  const r = getDb().getFirstSync<TripRow>(
    'SELECT * FROM trips WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1',
  );
  return r ? toTrip(r) : null;
}

export function startTrip(origin: string): Trip {
  const res = getDb().runSync(
    'INSERT INTO trips (started_at, origin) VALUES (?, ?)',
    Date.now(),
    origin,
  );
  return {
    id: res.lastInsertRowId,
    startedAt: Date.now(),
    endedAt: null,
    distanceM: 0,
    origin,
  };
}

/** 位置点を追加し、直前の点からの距離を累積する。 */
export function addPoints(tripId: number, pts: TripPoint[]) {
  const d = getDb();
  d.withTransactionSync(() => {
    let last = d.getFirstSync<{ lat: number; lng: number }>(
      'SELECT lat, lng FROM points WHERE trip_id = ? ORDER BY id DESC LIMIT 1',
      tripId,
    );
    let added = 0;
    for (const p of pts) {
      if (last) {
        const seg = haversine(
          { latitude: last.lat, longitude: last.lng },
          { latitude: p.latitude, longitude: p.longitude },
        );
        // GPSのふらつき(止まっている時の微小移動)は距離に含めない
        if (seg < 3) continue;
        added += seg;
      }
      d.runSync(
        'INSERT INTO points (trip_id, ts, lat, lng, accuracy) VALUES (?, ?, ?, ?, ?)',
        tripId,
        p.ts,
        p.latitude,
        p.longitude,
        p.accuracy,
      );
      last = { lat: p.latitude, lng: p.longitude };
    }
    if (added > 0) d.runSync('UPDATE trips SET distance_m = distance_m + ? WHERE id = ?', added, tripId);
  });
}

/** 走行を終了。短すぎる場合は誤検知として破棄し null を返す。 */
export function finishTrip(tripId: number, discardIfShort: boolean): Trip | null {
  const d = getDb();
  const row = d.getFirstSync<TripRow>('SELECT * FROM trips WHERE id = ?', tripId);
  if (!row) return null;
  if (discardIfShort && row.distance_m < MIN_TRIP_DISTANCE_M) {
    d.runSync('DELETE FROM trips WHERE id = ?', tripId);
    return null;
  }
  d.runSync('UPDATE trips SET ended_at = ? WHERE id = ?', Date.now(), tripId);
  return toTrip({ ...row, ended_at: Date.now() });
}

export function listTrips(): Trip[] {
  return getDb()
    .getAllSync<TripRow>('SELECT * FROM trips WHERE ended_at IS NOT NULL ORDER BY started_at DESC')
    .map(toTrip);
}

export function getTrip(id: number): Trip | null {
  const r = getDb().getFirstSync<TripRow>('SELECT * FROM trips WHERE id = ?', id);
  return r ? toTrip(r) : null;
}

export function getPoints(tripId: number): TripPoint[] {
  return getDb()
    .getAllSync<{ ts: number; lat: number; lng: number; accuracy: number | null }>(
      'SELECT ts, lat, lng, accuracy FROM points WHERE trip_id = ? ORDER BY id',
      tripId,
    )
    .map((p) => ({ ts: p.ts, latitude: p.lat, longitude: p.lng, accuracy: p.accuracy }));
}

export function deleteTrip(id: number) {
  getDb().runSync('DELETE FROM trips WHERE id = ?', id);
}
