import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getEmbedding } from '@/lib/ml';

// -------------------------------------------------------
// Vektör benzerliği
// -------------------------------------------------------
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// -------------------------------------------------------
// Bozuk Arapça font eşleşmelerini düzelt
// -------------------------------------------------------
function mapCorruptedArabic(text: string): string {
  if (!text) return '';
  let result = text
    .replace(/ĺ/g, 'ي')
    .replace(/Ĺ/g, 'ي')
    .replace(/ï/g, 'د')
    .replace(/Û/g, 'ت')
    .replace(/Ą/g, 'ض')
    .replace(/Ö/g, 'ب')
    .replace(/ó/g, 'ر')
    .replace(/ĩ/g, 'ع')
    .replace(/Đ/g, 'م')
    .replace(/Ĝ/g, 'ق')
    .replace(/א/g, 'ا')
    .replace(/ħ/g, 'م')
    .replace(/Ĭ/g, 'ن')
    .replace(/ģ/g, 'ه')
    .replace(/Ļ/g, 'ي')
    .replace(/ė/g, 'ف')
    .replace(/ĉ/g, 'ح')
    .replace(/ĝ/g, 'ي')
    .replace(/Ĥ/g, 'ل')
    .replace(/Ý/g, 'ت')
    .replace(/Ę/g, 'ف')
    .replace(/ā/g, 'ا')
    .replace(/đ/g, 'ر')
    .replace(/כ/g, 'ك');

  // Türkçe büyük İ harfini sadece Arapça/Bozuk font harf/hareke bağlamında Arapça Lam (ل) harfine dönüştür
  result = result.replace(/İ(?=[\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģכĻėĉĝĤÝĘāđ])/g, 'ل');
  result = result.replace(/([\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģכĻėĉĝĤÝĘāđ])İ/g, '$1ل');

  return result;
}

// -------------------------------------------------------
// Türkçe ve Arapça karakter normalize (arama için)
// -------------------------------------------------------
function normalize(text: string): string {
  if (!text) return '';
  let clean = mapCorruptedArabic(text);
  return clean
    .toLocaleLowerCase('tr-TR')
    // Türkçe normalizasyonu
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    // Arapça normalizasyonu
    .replace(/[\u064b-\u0652\u0670]/g, '') // Diacritics (Tashkeel)
    .replace(/\u0640/g, '') // Tatweel (Kashida)
    .replace(/[أإآٱ]/g, 'ا') // Alifs
    .replace(/[ىی]/g, 'ي') // Ya / Alif Maksura
    .replace(/ة/g, 'ه') // Ta Marbuta
    // Noktalama ve boşluklar
    .replace(/[.,!?;:()\[\]{}\*_~="'\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// İndeks için (noktalama temizlemeden)
function normalizeLight(text: string): string {
  if (!text) return '';
  let clean = mapCorruptedArabic(text);
  return clean
    .toLocaleLowerCase('tr-TR')
    // Türkçe normalizasyonu
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    // Arapça normalizasyonu
    .replace(/[\u064b-\u0652\u0670]/g, '') // Diacritics
    .replace(/\u0640/g, '') // Tatweel
    .replace(/[أإآٱ]/g, 'ا') // Alifs
    .replace(/[ىی]/g, 'ي') // Ya / Alif Maksura
    .replace(/ة/g, 'ه'); // Ta Marbuta
}

// -------------------------------------------------------
// Kelimeyi HTML'de vurgula (Ctrl+F işareti)
// -------------------------------------------------------
function highlightWords(text: string, words: string[]): string {
  let result = text;
  
  // Arapça kelimelerin ters hallerini (visual order) de vurgulama listesine ekle
  const expandedWords: string[] = [];
  for (const word of words) {
    if (!word) continue;
    expandedWords.push(word);
    
    const isArabic = /[\u0600-\u06FF]/.test(word);
    if (isArabic) {
      const reversed = word.split('').reverse().join('');
      if (reversed !== word) {
        expandedWords.push(reversed);
      }
    }
  }

  for (const word of expandedWords) {
    if (!word || word.length < 2) continue;
    
    // Hem Türkçe hem Arapça için fuzzy regex deseni oluştur
    const pattern = word.split('').map(ch => {
      const escMap: Record<string, string> = {
        'c': '[cçCÇ]', 'g': '[gğGĞ]', 'i': '[iıİI]', 'o': '[oöOÖ]',
        's': '[sşSŞ]', 'u': '[uüUÜ]', 'a': '[aâAÂ]',
        // Arapça fuzzy eşleşmeler
        'ا': '[اأإآٱ]',
        'أ': '[اأإآٱ]',
        'إ': '[اأإآٱ]',
        'آ': '[اأإآٱ]',
        'ى': '[يىی]',
        'ي': '[يىی]',
        'ی': '[يىی]',
        'ة': '[هة]',
        'ه': '[هة]',
      };
      
      const mapped = escMap[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Arapça karakterlerden sonra opsiyonel diacritics/tatweel'e izin ver
      const isArabicChar = /[\u0600-\u06FF]/.test(ch);
      if (isArabicChar) {
        return mapped + '[\u064b-\u0652\u0670\u0640]*';
      }
      return mapped;
    }).join('');

    try {
      result = result.replace(
        new RegExp(`(${pattern})`, 'gi'),
        '<mark class="bg-yellow-400/60 text-white px-0.5 rounded font-semibold">$1</mark>'
      );
    } catch (e) {
      console.warn("Highlight regex error:", e);
    }
  }
  return result;
}

// -------------------------------------------------------
// Metinde sayfa numarası tespit et ([PAGE: N] marker)
// -------------------------------------------------------
function findPage(text: string, charIdx: number): string | null {
  if (charIdx < 0) return null;
  const before = text.substring(0, charIdx + 10);
  const markerIdx = before.lastIndexOf('[PAGE: ');
  if (markerIdx === -1) return null;
  const end = before.indexOf(']', markerIdx);
  if (end === -1) return null;
  return before.substring(markerIdx + 7, end);
}

// -------------------------------------------------------
// Bir metindeki tüm eşleşme konumlarını bul (sayfa bazlı)
// -------------------------------------------------------
interface PageMatchInfo {
  page: string;
  count: number;
  firstSnippet: string;
}

function findAllPageMatches(cleanText: string, queryWords: string[], normQuery: string, mode: string): PageMatchInfo[] {
  if (!cleanText || queryWords.length === 0) return [];

  const pageSegments: { page: string; text: string; normText: string }[] = [];
  const pageRegex = /\[PAGE: (\d+)\]/g;
  let match;

  const matches: { page: string; index: number; length: number }[] = [];
  while ((match = pageRegex.exec(cleanText)) !== null) {
    matches.push({
      page: match[1],
      index: match.index,
      length: match[0].length
    });
  }

  if (matches.length > 0) {
    // İlk marker öncesi metin
    if (matches[0].index > 0) {
      const preText = cleanText.substring(0, matches[0].index);
      if (preText.trim()) {
        pageSegments.push({ page: '1', text: preText, normText: normalizeLight(preText) });
      }
    }
    // Marker'lar arası metin segmentleri
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].length;
      const end = (i + 1 < matches.length) ? matches[i + 1].index : cleanText.length;
      const segText = cleanText.substring(start, end).trim();
      pageSegments.push({ page: matches[i].page, text: segText, normText: normalizeLight(segText) });
    }
  }

  // PAGE marker yoksa (belge tüm metin olarak işlendi)
  if (pageSegments.length === 0) {
    const normFull = normalizeLight(cleanText);
    let count = 0;
    let firstSnippet = '';

    // Tam sorgu eşleşmesi dene (ve ters halini dene eğer Arapça ise)
    const normQ = normalizeLight(normQuery.trim());
    const isArabicPhrase = /[\u0600-\u06FF]/.test(normQ);
    const reversedNormQ = isArabicPhrase ? normQ.split(/\s+/).reverse().join(' ') : '';

    if (normQ.length >= 2) {
      let idx = 0;
      while (true) {
        const foundNormal = normFull.indexOf(normQ, idx);
        const foundReversed = reversedNormQ ? normFull.indexOf(reversedNormQ, idx) : -1;
        const found = foundNormal !== -1 && foundReversed !== -1 
          ? Math.min(foundNormal, foundReversed) 
          : foundNormal !== -1 ? foundNormal : foundReversed;

        if (found === -1) break;

        // Arapça için kelime sınırı kontrolü
        let isValid = true;
        if (isArabicPhrase) {
          const prev = found > 0 ? normFull[found - 1] : '';
          const next = found + normQ.length < normFull.length ? normFull[found + normQ.length] : '';
          if (/[\u0600-\u06FF]/.test(prev) || /[\u0600-\u06FF]/.test(next)) {
            isValid = false;
          }
        }

        if (isValid) {
          count++;
          if (!firstSnippet) {
            const start = Math.max(0, found - 60);
            const end = Math.min(cleanText.length, found + normQ.length + 100);
            firstSnippet = cleanText.substring(start, end).replace(/\[PAGE: \d+\]/g, '').trim();
          }
        }
        idx = found + 1;
      }
    }

    if (mode !== 'phrase' && count === 0) {
      for (const word of queryWords) {
        if (word.length < 2) continue;
        const isArabicW = /[\u0600-\u06FF]/.test(word);
        const reversedWord = isArabicW ? word.split('').reverse().join('') : '';

        let idx = 0;
        while (true) {
          const foundNormal = normFull.indexOf(word, idx);
          const foundReversed = reversedWord ? normFull.indexOf(reversedWord, idx) : -1;
          const found = foundNormal !== -1 && foundReversed !== -1 
            ? Math.min(foundNormal, foundReversed) 
            : foundNormal !== -1 ? foundNormal : foundReversed;

          if (found === -1) break;

          // Arapça kelime sınırı kontrolü
          let isValid = true;
          if (isArabicW) {
            const prev = found > 0 ? normFull[found - 1] : '';
            const next = found + word.length < normFull.length ? normFull[found + word.length] : '';
            if (/[\u0600-\u06FF]/.test(prev) || /[\u0600-\u06FF]/.test(next)) {
              isValid = false;
            }
          }

          if (isValid) {
            count++;
            if (!firstSnippet) {
              const start = Math.max(0, found - 60);
              const end = Math.min(cleanText.length, found + word.length + 100);
              firstSnippet = cleanText.substring(start, end).replace(/\[PAGE: \d+\]/g, '').trim();
            }
          }
          idx = found + 1;
        }
      }
    }

    if (count > 0) return [{ page: '1', count, firstSnippet }];
    return [];
  }

  // Her sayfa segmentinde eşleşme ara
  const pageMatchMap = new Map<string, PageMatchInfo>();

  for (const seg of pageSegments) {
    let count = 0;
    let firstSnippet = '';

    // Tam sorgu eşleşmesi önce dene
    const normQ = normalizeLight(normQuery.trim());
    const isArabicPhrase = /[\u0600-\u06FF]/.test(normQ);
    const reversedNormQ = isArabicPhrase ? normQ.split(/\s+/).reverse().join(' ') : '';

    if (normQ.length >= 2) {
      let idx = 0;
      while (true) {
        const foundNormal = seg.normText.indexOf(normQ, idx);
        const foundReversed = reversedNormQ ? seg.normText.indexOf(reversedNormQ, idx) : -1;
        const found = foundNormal !== -1 && foundReversed !== -1 
          ? Math.min(foundNormal, foundReversed) 
          : foundNormal !== -1 ? foundNormal : foundReversed;

        if (found === -1) break;

        // Arapça kelime sınırı kontrolü
        let isValid = true;
        if (isArabicPhrase) {
          const prev = found > 0 ? seg.normText[found - 1] : '';
          const next = found + normQ.length < seg.normText.length ? seg.normText[found + normQ.length] : '';
          if (/[\u0600-\u06FF]/.test(prev) || /[\u0600-\u06FF]/.test(next)) {
            isValid = false;
          }
        }

        if (isValid) {
          count++;
          if (!firstSnippet) {
            const start = Math.max(0, found - 40);
            const end = Math.min(seg.text.length, found + normQ.length + 80);
            firstSnippet = seg.text.substring(start, end).trim();
          }
        }
        idx = found + 1;
      }
    }

    // Kelime bazlı eşleşme (örtüşmeleri önlemek için) - sadece 'phrase' değilse
    if (mode !== 'phrase' && count === 0) {
      for (const word of queryWords) {
        if (word.length < 2) continue;
        const isArabicW = /[\u0600-\u06FF]/.test(word);
        const reversedWord = isArabicW ? word.split('').reverse().join('') : '';

        let idx = 0;
        while (true) {
          const foundNormal = seg.normText.indexOf(word, idx);
          const foundReversed = reversedWord ? seg.normText.indexOf(reversedWord, idx) : -1;
          const found = foundNormal !== -1 && foundReversed !== -1 
            ? Math.min(foundNormal, foundReversed) 
            : foundNormal !== -1 ? foundNormal : foundReversed;

          if (found === -1) break;

          // Arapça kelime sınırı kontrolü
          let isValid = true;
          if (isArabicW) {
            const prev = found > 0 ? seg.normText[found - 1] : '';
            const next = found + word.length < seg.normText.length ? seg.normText[found + word.length] : '';
            if (/[\u0600-\u06FF]/.test(prev) || /[\u0600-\u06FF]/.test(next)) {
              isValid = false;
            }
          }

          if (isValid) {
            count++;
            if (!firstSnippet) {
              const start = Math.max(0, found - 40);
              const end = Math.min(seg.text.length, found + word.length + 80);
              firstSnippet = seg.text.substring(start, end).trim();
            }
          }
          idx = found + 1;
        }
      }
    }

    if (count > 0) {
      const existing = pageMatchMap.get(seg.page);
      if (existing) {
        existing.count += count;
        if (!existing.firstSnippet) existing.firstSnippet = firstSnippet;
      } else {
        pageMatchMap.set(seg.page, {
          page: seg.page,
          count,
          firstSnippet: firstSnippet.substring(0, 120),
        });
      }
    }
  }

  return Array.from(pageMatchMap.values()).sort((a, b) => parseInt(a.page) - parseInt(b.page));
}

// -------------------------------------------------------
// Türkçe stopword'lerini temizle
// -------------------------------------------------------
const TR_STOPWORDS = [
  'nedir', 'nasil', 'nerede', 'ne', 'zaman', 'neden', 'nicin', 'kac',
  'hangi', 'olan', 'olani', 'hakkinda', 'ile', 'gore', 'icin',
  'bir', 've', 'ya', 'da', 'veya', 'ama', 'fakat', 'ancak',
  'acikla', 'anlat', 'tanimla', 'demek', 'bana', 'bul', 'goster',
  'ac', 'ararmisın', 'arat', 'notlari', 'notu', 'dersini', 'dersi',
];

function extractKeywords(rawQuery: string): string {
  const norm = normalize(rawQuery);
  const words = norm.split(/\s+/);
  const filtered = words.filter(w => w.length > 1 && !TR_STOPWORDS.includes(w));
  return filtered.join(' ') || norm;
}

// -------------------------------------------------------
// Ana Arama Endpoint
// -------------------------------------------------------
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q')?.trim() || '';
    const mode = searchParams.get('mode') || 'word'; // 'phrase' | 'word' | 'semantic'

    if (!rawQuery) return NextResponse.json({ results: [] });

    // Anahtar kelimeleri çıkar (cümle ve anlamsal aramada ham sorguyu koru)
    const keywords = (mode === 'phrase' || mode === 'semantic') ? rawQuery : extractKeywords(rawQuery);
    const query = keywords || rawQuery;
    const normQuery = normalize(query);
    const queryWords = normQuery.split(/\s+/).filter(w => w.length > 1);

    // Kullanıcıya ait dosyaları çek
    let { data: allFiles } = await supabase.from('files').select('*').eq('user_id', user.id);
    if (!allFiles || allFiles.length === 0) {
      const { data: fallback } = await supabase.from('files').select('*');
      allFiles = fallback || [];
    }
    const files = allFiles.filter((f: any) => !f.isDeleted);

    // AI Embedding (isteğe bağlı — API key varsa)
    // Cümle modunda vektör benzerliğini atlıyoruz
    const queryEmbedding = mode !== 'phrase' ? await getEmbedding(query) : [];
    const hasEmbedding = queryEmbedding.length > 0;

    // -------------------------------------------------------
    // Her dosya için skor hesapla
    // -------------------------------------------------------
    const scoredFiles = files.map((file: any) => {
      let score = 0;
      let aiScore = 0;
      let matchedChunkText = '';
      let isAiMatch = false;

      // --- 1. AI Benzerlik (chunk veya dosya embedding) ---
      if (hasEmbedding && mode !== 'phrase') {
        let maxSim = 0;
        if (file.chunks?.length > 0) {
          for (const chunk of file.chunks) {
            if (!chunk.embedding?.length) continue;
            const s = cosineSimilarity(queryEmbedding, chunk.embedding);
            if (s > maxSim) { maxSim = s; matchedChunkText = chunk.text; }
          }
        } else if (file.embedding?.length > 0) {
          const s = cosineSimilarity(queryEmbedding, file.embedding);
          if (s > maxSim) { maxSim = s; }
        }

        // Gemini embeddings için taban benzerlik eşiği (örn: 0.55)
        // Bu eşiğin altındaki rastgele/ilgisiz eşleşmeler filtrelenir.
        const SEMANTIC_THRESHOLD = 0.55;
        if (maxSim >= SEMANTIC_THRESHOLD) {
          aiScore = maxSim;
          isAiMatch = true;
        }
      }

      // --- 2. PDF içerik temizle ---
      let cleanText = file.extractedText || '';
      // Eğer metnin en başında FONTMAP header'ı varsa onu kes
      if (cleanText.startsWith('[FONTMAP:')) {
        const lineEnd = cleanText.indexOf('\n');
        if (lineEnd !== -1) {
          cleanText = cleanText.substring(lineEnd + 1);
        }
      }
      // PDF binary/operatör çöplerini kes
      const garbageIdx = cleanText.indexOf('Artifact    Attached');
      if (garbageIdx !== -1) cleanText = cleanText.substring(0, garbageIdx);
      // Çok uzun metinleri kırpma (Kitapların tamamı taranabilsin diye limiti 5 Milyon karaktere çıkardık)
      if (cleanText.length > 5000000) cleanText = cleanText.substring(0, 5000000);

      const normFileName = normalize(file.name || '');
      const normCatId   = normalize(file.categoryId || '');
      const normFull    = normalizeLight(cleanText);

      // --- 3. Dosya adı / kategori tam eşleşme skoru ---
      let exactNameMatchScore = 0;
      const isArabicQuery = /[\u0600-\u06FF]/.test(normQuery);
      const reversedNormQuery = isArabicQuery ? normQuery.split(/\s+/).reverse().join(' ') : '';
      const nameMatch = normFileName.includes(normQuery) || normQuery.includes(normFileName) || normCatId.includes(normQuery);
      const reversedNameMatch = reversedNormQuery && (normFileName.includes(reversedNormQuery) || reversedNormQuery.includes(normFileName) || normCatId.includes(reversedNormQuery));

      if (nameMatch || reversedNameMatch) {
        exactNameMatchScore = 0.90;
      }

      // --- 4. İçerik tam eşleşme skoru (Ctrl+F) ---
      let exactMatchScore = 0;
      const normQueryLight = normalizeLight(query);
      if (normQueryLight.length >= 2) {
        const isArabicLight = /[\u0600-\u06FF]/.test(normQueryLight);
        const reversedQueryLight = isArabicLight ? normQueryLight.split(/\s+/).reverse().join(' ') : '';
        const matchNormal = normFull.includes(normQueryLight);
        const matchReversed = reversedQueryLight && normFull.includes(reversedQueryLight);
        if (matchNormal || matchReversed) {
          exactMatchScore = 0.85;
        }
      }

      // --- 5. Kelime bazlı eşleşme skoru ---
      let wordScore = 0;
      let matchedCount = 0;
      let contentMatchCount = 0;
      for (const word of queryWords) {
        if (word.length < 2) continue;
        const isArabicWord = /[\u0600-\u06FF]/.test(word);
        const reversedWord = isArabicWord ? word.split('').reverse().join('') : '';

        const inName = normFileName.includes(word) || (reversedWord && normFileName.includes(reversedWord));
        const inCat  = normCatId.includes(word) || (reversedWord && normCatId.includes(reversedWord));
        const inText = normFull.includes(word) || (reversedWord && normFull.includes(reversedWord));

        if (inName || inCat || inText) matchedCount++;
        if (inText) contentMatchCount++;
      }

      if (queryWords.length > 0 && matchedCount > 0) {
        const contentBonus = contentMatchCount > 0 ? 0.15 : 0;
        wordScore = 0.50 + (matchedCount / queryWords.length) * 0.30 + contentBonus;
      }

      // --- Skor Birleştirme (Moda Göre) ---
      if (mode === 'semantic') {
        score = aiScore;
        if (exactNameMatchScore > 0) {
          score = Math.max(score, 0.85);
          isAiMatch = false;
        }
      } else if (mode === 'phrase') {
        const hasExactMatch = exactMatchScore > 0 || exactNameMatchScore > 0;
        score = hasExactMatch ? Math.max(exactMatchScore, exactNameMatchScore) : 0;
        isAiMatch = false;
      } else if (mode === 'word') {
        score = Math.max(aiScore, exactNameMatchScore, exactMatchScore, wordScore);
        if (score > aiScore) {
          isAiMatch = false;
        }
      } else if (mode === 'hybrid') {
        const lexicalScore = Math.max(exactNameMatchScore, exactMatchScore, wordScore);
        const semanticScore = aiScore;
        
        if (lexicalScore > 0 && semanticScore > 0) {
          score = Math.max(lexicalScore, semanticScore) + 0.08;
        } else {
          score = Math.max(lexicalScore, semanticScore);
        }
        
        if (score > aiScore) {
          isAiMatch = false;
        }
      }

      return { file, score, matchedChunkText, isAiMatch, cleanText };
    });

    // -------------------------------------------------------
    // Filtrele, sırala, snippet üret
    // -------------------------------------------------------
    const THRESHOLD = 0.35; // Daha düşük eşik — içerik araması her zaman sonuç dönsün
    const results = scoredFiles
      .filter((s: any) => s.score > THRESHOLD)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20) // Maksimum 20 sonuç
      .map((s: any) => {
        const { file, cleanText, isAiMatch, matchedChunkText } = s;
        let snippet = '';
        let pageMatch: string | null = null;

        // --- Çoklu konum tespiti ---
        let pageMatches: PageMatchInfo[] = [];
        let matchCount = 0;

        if (cleanText) {
          pageMatches = findAllPageMatches(cleanText, queryWords, normQuery, mode);
          matchCount = pageMatches.reduce((sum, pm) => sum + pm.count, 0);
        }

        if (cleanText) {
          const normFull = normalizeLight(cleanText);
          const normQ    = normalizeLight(query).trim();
          const words    = normQ.split(/\s+/).filter((w: string) => w.length > 1);

          // ---- Tam sorgu eşleşmesi (önce dene) ----
          const isArabicQ = /[\u0600-\u06FF]/.test(normQ);
          const reversedQ = isArabicQ ? normQ.split(/\s+/).reverse().join(' ') : '';
          
          let matchIdx = normFull.indexOf(normQ);
          if (matchIdx === -1 && reversedQ) {
            matchIdx = normFull.indexOf(reversedQ);
          }

          // ---- Tek tek kelime ara (Sadece 'phrase' değilse) ----
          if (mode !== 'phrase' && matchIdx === -1) {
            for (const w of words) {
              const isArabicW = /[\u0600-\u06FF]/.test(w);
              const revW = isArabicW ? w.split('').reverse().join('') : '';
              let idx = normFull.indexOf(w);
              if (idx === -1 && revW) {
                idx = normFull.indexOf(revW);
              }
              if (idx !== -1) { matchIdx = idx; break; }
            }
          }

          if (matchIdx !== -1) {
            // Etrafındaki bağlamı al (120 karakter önce, 200 karakter sonra)
            const ctxBefore = 120;
            const ctxAfter  = 200;
            const start = Math.max(0, matchIdx - ctxBefore);
            const end   = Math.min(cleanText.length, matchIdx + normQ.length + ctxAfter);
            let raw = cleanText.substring(start, end).replace(/\[PAGE: \d+\]/g, ' ').trim();

            // Sayfa tespiti
            const page = findPage(cleanText, matchIdx);
            if (page) { pageMatch = page; }

            // Satır tespiti
            const lineNum = cleanText.substring(0, matchIdx).split('\n').length;

            // Kelimeleri vurgula (cümle modunda sadece bütün sorguyu vurgula)
            const highlightList = mode === 'phrase' ? [normQ] : words.filter((w: string) => w.length > 1);
            raw = highlightWords(raw, highlightList);

            // Elipsis ekle
            if (start > 0) raw = '…' + raw;
            if (end < cleanText.length) raw += '…';

            // Konum etiketi
            const loc = page
              ? `<span class="bg-blue-900/60 text-blue-200 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 mr-2">📄 Sayfa ${page}</span>`
              : `<span class="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full mr-2">Satır ${lineNum}</span>`;

            snippet = `${loc}<span class="text-gray-200 text-sm leading-relaxed">${raw}</span>`;

          } else if (isAiMatch && matchedChunkText) {
            // AI chunk eşleşmesi
            let raw = matchedChunkText.substring(0, 300).replace(/\[PAGE: \d+\]/g, ' ').trim();
            const highlightList = mode === 'phrase' ? [normQ] : words.filter((w: string) => w.length > 1);
            raw = highlightWords(raw, highlightList);
            const aiBadge = `<span class="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30 mr-2">✨ Yapay Zeka Eşleşmesi</span>`;
            snippet = `${aiBadge}<span class="text-gray-200 text-sm leading-relaxed">${raw}…</span>`;
          }
        }

        // İçerik yoksa dosya adından göster
        if (!snippet && file.name) {
          const highlighted = highlightWords(file.name, queryWords.filter((w: string) => w.length > 1));
          snippet = `<span class="bg-yellow-900/40 text-yellow-200 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 mr-2">📁 Dosya Adı Eşleşmesi</span><span class="text-gray-200 text-sm">${highlighted}</span>`;
        }

        return {
          ...file,
          snippet,
          pageMatch,
          // YENİ: Çoklu konum bilgisi
          pageMatches: pageMatches.slice(0, 50).map(pm => ({
            page: pm.page,
            count: pm.count,
            snippet: pm.firstSnippet,
          })),
          matchCount,
          // Hassas verileri client'a gönderme
          extractedText: undefined,
          embedding: undefined,
          chunks: undefined,
        };
      });

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Arama hatası:', error);
    return NextResponse.json({ error: 'Arama sırasında bir hata oluştu.' }, { status: 500 });
  }
}
