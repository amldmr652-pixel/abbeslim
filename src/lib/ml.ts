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
