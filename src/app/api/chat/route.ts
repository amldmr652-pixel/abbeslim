import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getEmbedding } from '@/lib/ml';

interface Chunk {
  text: string;
  embedding?: number[];
  page?: number | string;
}

interface FileRecord {
  id: string;
  name: string;
  url: string;
  extractedText?: string;
  chunks?: Chunk[];
}

interface SourceResult {
  text: string;
  fileName: string;
  page: string | number;
  fileId: string;
  fileUrl: string;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function getPageFromMarker(extractedText: string, charOffset: number): number {
  // [PAGE: N] marker'larına göre sayfa bul
  const pageRegex = /\[PAGE:\s*(\d+)\]/g;
  let lastPage = 1;
  let match: RegExpExecArray | null;
  while ((match = pageRegex.exec(extractedText)) !== null) {
    if (match.index > charOffset) break;
    lastPage = parseInt(match[1], 10);
  }
  return lastPage;
}

function keywordScore(text: string, question: string): number {
  const normText = text.toLowerCase();
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;
  let hits = 0;
  for (const word of words) {
    if (normText.includes(word)) hits++;
  }
  return hits / words.length;
}

function extractParagraphs(extractedText: string): { text: string; page: number }[] {
  // [PAGE: N] marker'larına göre paragrafları ayır
  const parts = extractedText.split(/\[PAGE:\s*(\d+)\]/);
  const results: { text: string; page: number }[] = [];
  let currentPage = 1;
  for (let i = 0; i < parts.length; i++) {
    if (/^\d+$/.test(parts[i].trim())) {
      currentPage = parseInt(parts[i].trim(), 10);
    } else {
      const paragraphs = parts[i].split(/\n{2,}/);
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (trimmed.length > 40) {
          results.push({ text: trimmed, page: currentPage });
        }
      }
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI özelliği için GEMINI_API_KEY gerekli.' }, { status: 400 });
    }

    const supabase = await createClient();

    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const question: string = body.question ?? '';
    const fileId: string | undefined = body.fileId;
    const mode: 'sources' | 'independent' | 'hybrid' = body.mode ?? 'hybrid';

    if (!question.trim()) {
      return NextResponse.json({ error: 'Soru boş olamaz.' }, { status: 400 });
    }

    const allResults: SourceResult[] = [];
    let hasConflict = false;

    if (mode !== 'independent') {
      // Supabase'den dosyaları çek
      let query = supabase
        .from('files')
        .select('id, name, url, extractedText, chunks')
        .eq('user_id', user.id)
        .eq('isDeleted', false);

      if (fileId) {
        query = query.eq('id', fileId);
      }

      const { data: files, error: filesError } = await query;
      if (filesError) {
        return NextResponse.json({ error: 'Dosyalar alınamadı.' }, { status: 500 });
      }

      if (files && files.length > 0) {
        // Soru için embedding al
        const questionEmbedding = await getEmbedding(question);
        const useEmbedding = questionEmbedding.length > 0;

        for (const file of files as FileRecord[]) {
          // Chunk'ları varsa önce onları dene
          if (file.chunks && Array.isArray(file.chunks) && file.chunks.length > 0) {
            for (const chunk of file.chunks) {
              if (!chunk.text || chunk.text.trim().length < 20) continue;

              let score = 0;
              if (useEmbedding && chunk.embedding && chunk.embedding.length > 0) {
                score = cosineSimilarity(questionEmbedding, chunk.embedding);
              } else {
                score = keywordScore(chunk.text, question);
              }

              let page: string | number = chunk.page ?? 1;
              // Eğer chunk'ta sayfa yok ama extractedText varsa marker'dan bul
              if (!chunk.page && file.extractedText) {
                const idx = file.extractedText.indexOf(chunk.text.substring(0, 50));
                if (idx !== -1) {
                  page = getPageFromMarker(file.extractedText, idx);
                }
              }

              allResults.push({
                text: chunk.text,
                fileName: file.name,
                page,
                fileId: file.id,
                fileUrl: file.url,
                score,
              });
            }
          } else if (file.extractedText && file.extractedText.trim().length > 0) {
            // Chunk yoksa extractedText'i paragraf olarak böl
            const paragraphs = extractParagraphs(file.extractedText);
            if (paragraphs.length === 0) {
              // Marker yoksa düz metin olarak böl
              const plainParagraphs = file.extractedText.split(/\n{2,}/);
              let pageNum = 1;
              for (const para of plainParagraphs) {
                const trimmed = para.trim();
                if (trimmed.length < 30) continue;
                const score = keywordScore(trimmed, question);
                allResults.push({
                  text: trimmed.substring(0, 1000),
                  fileName: file.name,
                  page: pageNum,
                  fileId: file.id,
                  fileUrl: file.url,
                  score,
                });
                pageNum++;
              }
            } else {
              for (const para of paragraphs) {
                let score = 0;
                if (useEmbedding) {
                  const paraEmb = await getEmbedding(para.text.substring(0, 512));
                  score = cosineSimilarity(questionEmbedding, paraEmb);
                } else {
                  score = keywordScore(para.text, question);
                }
                allResults.push({
                  text: para.text.substring(0, 1000),
                  fileName: file.name,
                  page: para.page,
                  fileId: file.id,
                  fileUrl: file.url,
                  score,
                });
              }
            }
          }
        }
      }
    }

    // Skora göre sırala ve en iyi 8'i al
    allResults.sort((a, b) => b.score - a.score);
    const topResults = allResults.slice(0, 8);

    if (topResults.length === 0 && mode === 'sources') {
      return NextResponse.json({
        answer: 'Yüklü dosyalarınızda bu soruyla ilgili içerik bulunamadı (Sadece Belge modunda arama yapıldı).',
        sources: [],
        hasConflict: false,
        conflictNote: '',
      });
    }

    // Çelişki tespiti: 2+ farklı dosyadan kaynak var mı?
    const uniqueFileIds = new Set(topResults.map(r => r.fileId));
    hasConflict = mode === 'independent' ? false : uniqueFileIds.size >= 2;

    // Sadece gerçekten alakalı sonuçları dahil et (score > 0)
    const relevantResults = topResults.filter(r => r.score > 0);

    let userMessage: string;
    if (relevantResults.length > 0 && mode !== 'independent') {
      const sourceText = relevantResults
        .map((r, i) => `[KAYNAK ${i + 1} - ${r.fileName}, Sayfa ${r.page}]:\n${r.text}`)
        .join('\n\n');
      userMessage = `Aşağıdaki kaynaklar kullanıcının yüklediği PDF belgelerinden alınmıştır:\n\n${sourceText}\n\nKULLANICI SORUSU: ${question}`;
    } else {
      userMessage = `KULLANICI SORUSU: ${question}`;
    }

    // Mod bazlı system instruction belirleme
    const titleDirective = '\n\nÖNEMLİ: Cevabının en sonuna mutlaka [TITLE: konu_adi] formatında, Türkçe karakterler içermeyen, boşluk yerine alt çizgi (_) kullanan, dosya ismi olmaya uygun (max 30 karakter) kısa bir konu başlığı ekle (örn: [TITLE: Osmanli_Cokus_Nedenleri]).';

    let systemInstructionText = '';
    if (mode === 'independent') {
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcıyla genel konularda sohbet et, sorularını kendi geniş genel bilgine dayanarak Türkçe cevapla. PDF belgelerini veya kaynaklarını referans almana gerek yoktur. Cevabında kesinlikle [1], [2] gibi kaynak numaraları kullanma.` + titleDirective;
    } else if (mode === 'sources') {
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
DAVRANIŞIN:
- Sadece sana verilen KAYNAK METİNLERE dayanarak Türkçe cevap ver. Kaynakların dışına asla çıkma, tahmin yürütme.
- PDF kaynaklardan gelen bilgileri kullanırken, bilginin veya cümlenin hemen sonuna [1], [2] gibi kaynak numaraları ekle (örn: "...anlatmaktadır [1]."). Metin içinde kesinlikle dosya adı, sayfa veya URL yazma, sadece [numara] formatını kullan. Numaralar sırasıyla yukarındaki KAYNAK listesindeki sıraya (1'den başlayarak) karşılık gelmelidir.
- Eğer iki farklı kaynakta çelişen bilgi varsa her ikisini de yaz ve çeliştiğini belirt.
- Kesinlikle PDF kaynaklarında olmayan bilgileri uydurma.
- Cevapların kısa, net ve yardımcı olsun.` + titleDirective;
    } else {
      // hybrid (ikisi birlikte)
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
DAVRANIŞIN:
- Selamlama, teşekkür gibi sosyal mesajlara doğal ve sıcak şekilde Türkçe yanıt ver.
- PDF kaynaklardan gelen bilgileri kullanırken, bilginin veya cümlenin hemen sonuna [1], [2] gibi kaynak numaraları ekle (örn: "...anlatmaktadır [1]."). Metin içinde kesinlikle dosya adı, sayfa veya URL yazma, sadece [numara] formatını kullan. Numaralar sırasıyla yukarındaki KAYNAK listesindeki sıraya (1'den başlayarak) karşılık gelmelidir.
- PDF belgelerinde aranan bilgi yoksa veya eksikse, kendi genel bilgini kullanarak cevabı zenginleştir, ancak PDF kaynaklarından aldığın bilgileri [numara] ile işaretlemeye devam et. Kendi bilginden ekleme yaptığında kaynak numarası koyma.
- Eğer iki farklı kaynakta çelişen bilgi varsa her ikisini de yaz ve çeliştiğini belirt.
- Cevapların kısa, net ve yardımcı olsun.` + titleDirective;
    }

    // Gemini API çağrısı (Sırasıyla modelleri dener - Fallback yapısı)
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    let geminiRes: Response | null = null;
    let lastErrorText = '';
    let usedModel = '';

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstructionText }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userMessage }],
                },
              ],
              generationConfig: {
                temperature: mode === 'independent' ? 0.7 : 0.3,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (response.ok) {
          geminiRes = response;
          usedModel = model;
          break;
        } else {
          lastErrorText = await response.text();
          console.warn(`Model ${model} hata verdi (Status: ${response.status}):`, lastErrorText);
        }
      } catch (err) {
        console.error(`Model ${model} isteği başarısız oldu:`, err);
        lastErrorText = err instanceof Error ? err.message : String(err);
      }
    }

    if (!geminiRes) {
      // Bütün modeller başarısız olduysa gerçek hata mesajını döndür
      console.error('Tüm Gemini modelleri başarısız oldu. Son hata:', lastErrorText);
      let errMsg = 'AI yanıtı alınamadı (Modellerde yoğunluk var).';
      try {
        const errJson = JSON.parse(lastErrorText);
        errMsg = errJson?.error?.message ?? errMsg;
      } catch { /* ignore */ }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const rawAnswer: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Yanıt alınamadı.';

    // Konu başlığını ayıkla (dosya adı için)
    const titleMatch = rawAnswer.match(/\[TITLE:\s*([^\]\n]+)\]/);
    let title = 'Calisma_Notu';
    let answer = rawAnswer;
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').substring(0, 40);
      if (title.endsWith('_')) title = title.substring(0, title.length - 1);
      if (title.startsWith('_')) title = title.substring(1);
      
      // Görünür cevaptan [TITLE: ...] bloğunu kaldır
      answer = rawAnswer.replace(/\[TITLE:\s*[^\]]+\]/, '').trim();
    }

    const sources = mode === 'independent' ? [] : relevantResults.map(r => ({
      fileName: r.fileName,
      page: r.page,
      fileId: r.fileId,
      url: r.fileUrl,
    }));

    return NextResponse.json({
      answer,
      title,
      sources,
      hasConflict,
      conflictNote: hasConflict
        ? 'Farklı kaynaklarda çelişen bilgiler tespit edildi. Lütfen kaynakları karşılaştırın.'
        : '',
    });
  } catch (err) {
    console.error('Chat API hatası:', err);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
