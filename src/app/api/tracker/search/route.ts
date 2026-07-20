import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const mediaType = searchParams.get('type') || 'movie';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Kitap araması: Google Books API (birincil) + OpenLibrary (fallback)
    if (mediaType === 'book') {
      let allResults: any[] = [];

      // 1. Google Books API (ücretsiz, API key gerektirmez)
      try {
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&printType=books`
        );
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          const googleResults = (googleData.items || []).map((item: any) => ({
            id: `gbook-${item.id}`,
            title: item.volumeInfo?.title || '',
            name: item.volumeInfo?.title || '',
            release_date: item.volumeInfo?.publishedDate || '',
            vote_average: item.volumeInfo?.averageRating || 0,
            poster_path: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            is_google_book: true,
            authors: item.volumeInfo?.authors?.join(', ') || '',
          }));
          allResults.push(...googleResults);
        }
      } catch (err) {
        console.error('Google Books API Error:', err);
      }

      // 2. OpenLibrary API (fallback, daha fazla sonuç)
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`
        );
        if (olRes.ok) {
          const olData = await olRes.json();
          const olResults = (olData.docs || []).map((item: any) => ({
            id: `ol-${item.key}`,
            title: item.title || '',
            name: item.title || '',
            release_date: item.first_publish_year ? item.first_publish_year.toString() : '',
            vote_average: 0,
            poster_path: item.cover_i
              ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
              : null,
            is_google_book: true,
            authors: item.author_name?.join(', ') || '',
          }));
          allResults.push(...olResults);
        }
      } catch (err) {
        console.error('OpenLibrary API Error:', err);
      }

      // Tekrarları kaldır (aynı başlık)
      const seen = new Set<string>();
      const uniqueResults = allResults.filter(r => {
        const key = r.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({ results: uniqueResults.slice(0, 20) });
    }

    // Film/Dizi araması: TMDB API (mevcut davranış)
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
    console.error('Tracker Search Error:', error);
    return NextResponse.json({ error: error.message || 'Search failed', results: [] }, { status: 500 });
  }
}
