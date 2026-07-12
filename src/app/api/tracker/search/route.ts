import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const mediaType = searchParams.get('type') || 'movie';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '01401f4f7f3ad1252a69fa66a4c59f1d';
    const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
    
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(query)}&page=1`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB responded with status ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error: any) {
    console.error('TMDB Proxy Search Error:', error);
    return NextResponse.json({ error: error.message || 'Search failed', results: [] }, { status: 500 });
  }
}
