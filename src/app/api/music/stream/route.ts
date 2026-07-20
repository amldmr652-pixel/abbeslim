import { NextResponse } from 'next/server';

// Invidious instance'ları — birden fazla fallback
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://vid.puffyan.us',
  'https://iv.datura.network',
  'https://invidious.privacyredirect.com',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId parametresi gerekli.' }, { status: 400 });
  }

  // Her instance'ı dene
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      // Ses formatlarını bul (adaptiveFormats'tan)
      const audioFormats = (data.adaptiveFormats || [])
        .filter((f: any) => f.type?.startsWith('audio/'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audioFormats.length > 0) {
        return NextResponse.json({
          audioUrl: audioFormats[0].url,
          title: data.title || '',
          author: data.author || '',
          lengthSeconds: data.lengthSeconds || 0,
          instance,
        });
      }
    } catch (err) {
      console.warn(`Invidious instance failed: ${instance}`, err);
      continue;
    }
  }

  return NextResponse.json({ error: 'Ses kaynağı bulunamadı.' }, { status: 404 });
}
