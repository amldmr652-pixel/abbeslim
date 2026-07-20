import { NextResponse } from 'next/server';
import { INVIDIOUS_INSTANCES } from '@/lib/invidious';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlistId');

  if (!playlistId) {
    return NextResponse.json({ error: 'playlistId parametresi gerekli.' }, { status: 400 });
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/playlists/${playlistId}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const videos = (data.videos || []).map((v: any) => ({
        videoId: v.videoId,
        title: v.title || 'Bilinmeyen Şarkı',
        author: v.author || '',
        lengthSeconds: v.lengthSeconds || 0,
      }));

      return NextResponse.json({
        title: data.title || 'Playlist',
        videos,
        instance,
      });
    } catch (err) {
      console.warn(`Invidious playlist failed: ${instance}`, err);
      continue;
    }
  }

  return NextResponse.json({ error: 'Playlist bulunamadı.' }, { status: 404 });
}
