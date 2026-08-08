import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const mediaType = searchParams.get('type') || 'movie';

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = query.trim();

    // ==========================================
    // 1. KİTAP ARAMASI (Google Books + OpenLibrary)
    // ==========================================
    if (mediaType === 'book') {
      let bookResults: any[] = [];

      // 1.1 Google Books API
      try {
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=15&printType=books`,
          { next: { revalidate: 3600 } }
        );
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          const googleMapped = (googleData.items || []).map((item: any) => {
            const info = item.volumeInfo || {};
            const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
            const secureThumb = thumb ? thumb.replace('http:', 'https:') : null;
            return {
              id: `gbook-${item.id}`,
              title: info.title || '',
              name: info.title || '',
              release_date: info.publishedDate || '',
              vote_average: info.averageRating || 0,
              poster_path: secureThumb,
              is_book: true,
              authors: info.authors?.join(', ') || '',
            };
          });
          bookResults.push(...googleMapped);
        }
      } catch (err) {
        console.error('Google Books Search Error:', err);
      }

      // 1.2 OpenLibrary API (Fallback / Ek Sonuçlar)
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=15`,
          { next: { revalidate: 3600 } }
        );
        if (olRes.ok) {
          const olData = await olRes.json();
          const olMapped = (olData.docs || []).map((item: any) => ({
            id: `ol-${item.key}`,
            title: item.title || '',
            name: item.title || '',
            release_date: item.first_publish_year ? item.first_publish_year.toString() : '',
            vote_average: 0,
            poster_path: item.cover_i
              ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
              : null,
            is_book: true,
            authors: item.author_name?.join(', ') || '',
          }));
          bookResults.push(...olMapped);
        }
      } catch (err) {
        console.error('OpenLibrary Search Error:', err);
      }

      // Tekrarları kaldır (benzer başlıklar)
      const seen = new Set<string>();
      const uniqueBooks = bookResults.filter(b => {
        const key = b.title.toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({ results: uniqueBooks.slice(0, 20) });
    }

    // ==========================================
    // 2. FİLM & DİZİ ARAMASI (TVMaze + iTunes + TMDB)
    // ==========================================
    let mediaResults: any[] = [];

    // 2.1 TVMaze API (Ücretsiz, API key gerekmez, yüksek çözünürlüklü afişler)
    try {
      const tvmazeRes = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanQuery)}`,
        { next: { revalidate: 3600 } }
      );
      if (tvmazeRes.ok) {
        const tvmazeData = await tvmazeRes.json();
        const tvmazeMapped = (tvmazeData || []).map((entry: any) => {
          const show = entry.show || {};
          const poster = show.image?.original || show.image?.medium || null;
          return {
            id: `tvmaze-${show.id}`,
            title: show.name || '',
            name: show.name || '',
            release_date: show.premiered ? show.premiered.substring(0, 4) : '',
            vote_average: show.rating?.average || 0,
            poster_path: poster,
            is_book: false,
            source: 'tvmaze',
          };
        });
        mediaResults.push(...tvmazeMapped);
      }
    } catch (err) {
      console.error('TVMaze Search Error:', err);
    }

    // 2.2 iTunes Search API (Apple CDN, hızlı, yüksek kaliteli film/dizi afişleri)
    try {
      const itunesEntity = mediaType === 'movie' ? 'movie' : 'tvSeason';
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=${itunesEntity}&limit=10`,
        { next: { revalidate: 3600 } }
      );
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        const itunesMapped = (itunesData.results || []).map((item: any) => {
          const rawArtwork = item.artworkUrl100 || '';
          // 600x600 yüksek çözünürlüklü afiş formatı
          const highResArtwork = rawArtwork.replace('100x100bb.jpg', '600x600bb.jpg');
          return {
            id: `itunes-${item.trackId || item.collectionId}`,
            title: item.trackName || item.collectionName || '',
            name: item.trackName || item.collectionName || '',
            release_date: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
            vote_average: 0,
            poster_path: highResArtwork || null,
            is_book: false,
            source: 'itunes',
          };
        });
        mediaResults.push(...itunesMapped);
      }
    } catch (err) {
      console.error('iTunes Search Error:', err);
    }

    // 2.3 TMDB API (Opsiyonel / Ek Sonuçlar)
    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '01401f4f7f3ad1252a69fa66a4c59f1d';
      const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanQuery)}&page=1`,
        { next: { revalidate: 3600 } }
      );
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        const tmdbMapped = (tmdbData.results || []).map((item: any) => ({
          id: `tmdb-${item.id}`,
          title: item.title || item.name || '',
          name: item.title || item.name || '',
          release_date: item.release_date || item.first_air_date || '',
          vote_average: item.vote_average || 0,
          poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          is_book: false,
          source: 'tmdb',
        }));
        mediaResults.push(...tmdbMapped);
      }
    } catch (err) {
      console.error('TMDB Search Error (Skipping to fallback):', err);
    }

    // Afişi olanları ve benzersiz başlıkları önceliklendir
    const seenMedia = new Set<string>();
    const sortedMedia = mediaResults
      .filter(m => {
        const key = m.title.toLowerCase().trim();
        if (!key || seenMedia.has(key)) return false;
        seenMedia.add(key);
        return true;
      })
      .sort((a, b) => {
        // Afişi olanlar en üstte
        if (a.poster_path && !b.poster_path) return -1;
        if (!a.poster_path && b.poster_path) return 1;
        return 0;
      });

    return NextResponse.json({ results: sortedMedia.slice(0, 20) });
  } catch (error: any) {
    console.error('Tracker Search Route Error:', error);
    return NextResponse.json({ error: error.message || 'Arama başarısız oldu.', results: [] }, { status: 500 });
  }
}
