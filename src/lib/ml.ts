/**
 * Google Gemini gemini-embedding-2 API kullanarak metin vektörü üretir.
 * GEMINI_API_KEY env değişkeni tanımlı değilse boş dizi döner (klasik metin araması devreye girer).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // API key yoksa graceful fallback — klasik metin araması devreye girecek
    return [];
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text: text.substring(0, 2048) }] },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini embedding API hatası:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return data?.embedding?.values ?? [];
  } catch (e) {
    console.error('Embedding hatası:', e);
    return [];
  }
}

/**
 * PDF metnindeki bozuk Arapça font kodlamasını analiz eder ve harf eşleme tablosunu (JSON) döner.
 */
export async function detectAndExtractArabicFontMap(sampleText: string): Promise<Record<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !sampleText) {
    return {};
  }

  // Bozuk Arapça font izleri var mı kontrol et (Örn: özel Latin harfleri ve Arapça harfler bir arada mı?)
  const hasCorruptedSign = /[\u00C0-\u00FF\u0100-\u017F\u0590-\u05FF]/.test(sampleText) && /[\u0600-\u06FF]/.test(sampleText);
  if (!hasCorruptedSign) {
    return {};
  }

  try {
    const prompt = `Aşağıdaki metin, özel/bozuk yazı fontu kodlamasına sahip bir Arapça PDF'in metin katmanından alınmıştır.
Ekranda normal Arapça okunurken, kopyalandığında veya metin katmanı dışarı aktarıldığında bozuk karakterler (örn. özel Latin harfleri, İbranice harfler, semboller veya yanlış Arapça harfler) vermektedir.
Lütfen bu metindeki bozuk karakterler (anahtar) ile olması gereken gerçek Arapça harf/harekeler (değer) arasındaki birebir dönüşüm eşleşmesini bul.
Sonucu sadece ve sadece geçerli bir JSON objesi olarak döndür (açıklama, markdown kod bloğu vb. ekleme, sadece saf JSON string döndür).

JSON FORMATI ÖRNEĞİ:
{
  "ĺ": "ي",
  "ï": "د",
  "Û": "ت"
}

METİN ÖRNEĞİ:
${sampleText.substring(0, 1500)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini font-map API hatası:', response.status, await response.text());
      return {};
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJsonStr = answer.replace(/```json/g, '').replace(/```/g, '').trim();
    const mapping = JSON.parse(cleanJsonStr);
    
    if (mapping && typeof mapping === 'object') {
      console.log('Gemini Bozuk Arapça Font Haritası Çıkardı:', mapping);
      return mapping;
    }
    return {};
  } catch (err) {
    console.error('Bozuk font analizi hatası:', err);
    return {};
  }
}

