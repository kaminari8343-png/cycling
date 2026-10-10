import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getPoints, Trip } from './db';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildGpx(trip: Trip, name: string): string {
  const pts = getPoints(trip.id);
  const trkpts = pts
    .map(
      (p) =>
        `      <trkpt lat="${p.latitude.toFixed(7)}" lon="${p.longitude.toFixed(7)}"><time>${new Date(p.ts).toISOString()}</time></trkpt>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Commute Ride" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${esc(name)}</name><time>${new Date(trip.startedAt).toISOString()}</time></metadata>
  <trk>
    <name>${esc(name)}</name>
    <type>cycling</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

/** GPXファイルを作成し、共有シート(保存・他アプリへ送信)を開く */
export async function exportTripGpx(trip: Trip, name: string) {
  if (getPoints(trip.id).length === 0) throw new Error('この走行には位置データがありません');
  if (!(await Sharing.isAvailableAsync())) throw new Error('この端末では共有できません');
  const stamp = new Date(trip.startedAt).toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = new File(Paths.cache, `ride-${stamp}.gpx`);
  file.create({ overwrite: true });
  file.write(buildGpx(trip, name));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/gpx+xml',
    dialogTitle: 'GPXを書き出す',
    UTI: 'com.topografix.gpx',
  });
}
