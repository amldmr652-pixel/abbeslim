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

    // Bugünün tarihi (Yerel Türkiye Saati)
    const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const calendarDirective = `\n\nBugünün tarihi: ${todayDateStr}. Kullanıcı bir tarih belirttiğinde veya ekle/oluştur/getir/listele dediğinde uygun aracı çağır.

Erişebildiğin araçlar:
- create_calendar_event: Takvime yeni bir etkinlik ekler.
- create_finance_transaction: Finans modülüne gelir veya gider ekler.
- create_task: Görev listesine yeni bir görev ekler.
- update_task_status: Görevi tamamlandı olarak işaretler veya günceller.
- create_note: Notlar modülüne yeni bir hızlı not oluşturur.
- create_goal: Hedefler modülüne yeni hedef veya alışkanlık ekler.
- get_finance_summary: Finansal özet (gelir, gider, bakiye) getirir.
- get_tasks_summary: Görev listesi özetini getirir.
- get_calendar_events: Takvimdeki etkinlikleri getirir.
- search_files: Kütüphanedeki dosyalarda arama yapar.`;

    let systemInstructionText = '';
    if (mode === 'independent') {
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcıyla genel konularda sohbet et, sorularını kendi geniş genel bilgine dayanarak Türkçe cevapla. PDF belgelerini veya kaynaklarını referans almana gerek yoktur. Cevabında kesinlikle [1], [2] gibi kaynak numaraları kullanma.` + titleDirective + calendarDirective;
    } else if (mode === 'sources') {
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
DAVRANIŞIN:
- Sadece sana verilen KAYNAK METİNLERE dayanarak Türkçe cevap ver. Kaynakların dışına asla çıkma, tahmin yürütme.
- PDF kaynaklardan gelen bilgileri kullanırken, bilginin veya cümlenin hemen sonuna [1], [2] gibi kaynak numaraları ekle (örn: "...anlatmaktadır [1]."). Metin içinde kesinlikle dosya adı, sayfa veya URL yazma, sadece [numara] formatını kullan. Numaralar sırasıyla yukarındaki KAYNAK listesindeki sıraya (1'den başlayarak) karşılık gelmelidir.
- Eğer iki farklı kaynakta çelişen bilgi varsa her ikisini de yaz ve çeliştiğini belirt.
- Kesinlikle PDF kaynaklarında olmayan bilgileri uydurma.
- Cevapların kısa, net ve yardımcı olsun.` + titleDirective + calendarDirective;
    } else {
      // hybrid (ikisi birlikte)
      systemInstructionText = `Sen "abbeslim" adlı bir ders notu asistanısın. Kullanıcının yüklediği PDF belgelerine dayalı sorulara yardımcı olursun.
DAVRANIŞIN:
- Selamlama, teşekkür gibi sosyal mesajlara doğal ve sıcak şekilde Türkçe yanıt ver.
- PDF kaynaklardan gelen bilgileri kullanırken, bilginin veya cümlenin hemen sonuna [1], [2] gibi kaynak numaraları ekle (örn: "...anlatmaktadır [1]."). Metin içinde kesinlikle dosya adı, sayfa veya URL yazma, sadece [numara] formatını kullan. Numaralar sırasıyla yukarındaki KAYNAK listesindeki sıraya (1'den başlayarak) karşılık gelmelidir.
- PDF belgelerinde aranan bilgi yoksa veya eksikse, kendi genel bilgini kullanarak cevabı zenginleştir, ancak PDF kaynaklarından aldığın bilgileri [numara] ile işaretlemeye devam et. Kendi bilginden ekleme yaptığında kaynak numarası koyma.
- Eğer iki farklı kaynakta çelişen bilgi varsa her ikisini de yaz ve çeliştiğini belirt.
- Cevapların kısa, net ve yardımcı olsun.` + titleDirective + calendarDirective;
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
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: 'create_calendar_event',
                      description: 'Takvime yeni bir etkinlik ekler.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING', description: 'Etkinlik başlığı.' },
                          date: { type: 'STRING', description: 'Etkinlik tarihi (YYYY-MM-DD formatında).' },
                          time: { type: 'STRING', description: 'Etkinlik saati (HH:MM formatında, isteğe bağlı).' },
                          description: { type: 'STRING', description: 'Etkinlik açıklaması (isteğe bağlı).' }
                        },
                        required: ['title', 'date']
                      }
                    },
                    {
                      name: 'create_finance_transaction',
                      description: 'Finans modülüne yeni bir gelir veya gider işlemi ekler.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          type: { type: 'STRING', description: 'İşlem türü: "income" (gelir) veya "expense" (gider).' },
                          amount: { type: 'NUMBER', description: 'İşlem tutarı (pozitif sayı).' },
                          category: { type: 'STRING', description: 'Kategori (örn: Yemek, Ulaşım, Maaş, Kira, Market, Diğer).' },
                          description: { type: 'STRING', description: 'İşlem açıklaması (isteğe bağlı).' },
                          date: { type: 'STRING', description: 'İşlem tarihi (YYYY-MM-DD formatında).' }
                        },
                        required: ['type', 'amount', 'category']
                      }
                    },
                    {
                      name: 'create_task',
                      description: 'Görev listesine yeni bir görev ekler.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING', description: 'Görev başlığı.' },
                          due_date: { type: 'STRING', description: 'Son tarih (YYYY-MM-DD formatında).' },
                          priority: { type: 'STRING', description: 'Öncelik: "low", "medium" veya "high".' }
                        },
                        required: ['title']
                      }
                    },
                    {
                      name: 'update_task_status',
                      description: 'Mevcut bir görevi tamamlandı olarak işaretler veya günceller.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING', description: 'Görevin başlığı.' },
                          completed: { type: 'BOOLEAN', description: 'true = tamamlandı, false = tamamlanmadı.' }
                        },
                        required: ['title', 'completed']
                      }
                    },
                    {
                      name: 'create_note',
                      description: 'Notlar modülüne yeni bir hızlı not oluşturur.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING', description: 'Not başlığı.' },
                          content: { type: 'STRING', description: 'Not içeriği.' }
                        },
                        required: ['title', 'content']
                      }
                    },
                    {
                      name: 'create_goal',
                      description: 'Hedefler modülüne yeni bir hedef veya alışkanlık ekler.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING', description: 'Hedef veya alışkanlık adı.' },
                          type: { type: 'STRING', description: '"goal" (hedef) veya "habit" (alışkanlık).' },
                          target_value: { type: 'NUMBER', description: 'Hedef değeri.' },
                          frequency: { type: 'STRING', description: 'Alışkanlık sıklığı: "daily" veya "weekly".' }
                        },
                        required: ['title', 'type']
                      }
                    },
                    {
                      name: 'get_finance_summary',
                      description: 'Kullanıcının finansal özetini (toplam gelir, gider, bakiye) getirir.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          period: { type: 'STRING', description: '"this_month", "last_month" veya "all".' }
                        }
                      }
                    },
                    {
                      name: 'get_tasks_summary',
                      description: 'Kullanıcının görev listesinin özetini getirir.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          status: { type: 'STRING', description: '"pending", "completed" veya "all".' }
                        }
                      }
                    },
                    {
                      name: 'get_calendar_events',
                      description: 'Takvimden belirli bir tarih aralığındaki etkinlikleri getirir.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          start_date: { type: 'STRING', description: 'Başlangıç tarihi (YYYY-MM-DD).' },
                          end_date: { type: 'STRING', description: 'Bitiş tarihi (YYYY-MM-DD).' }
                        }
                      }
                    },
                    {
                      name: 'search_files',
                      description: 'Kullanıcının kütüphanesindeki dosyalarda arama yapar.',
                      parameters: {
                        type: 'OBJECT',
                        properties: {
                          query: { type: 'STRING', description: 'Aranacak kelime veya cümle.' }
                        },
                        required: ['query']
                      }
                    }
                  ]
                }
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

    // Inspect if a functionCall was requested
    const part = geminiData?.candidates?.[0]?.content?.parts?.[0];
    const functionCall = part?.functionCall;

    if (functionCall && functionCall.name === 'create_calendar_event') {
      const args = functionCall.args as {
        title: string;
        date: string;
        time?: string;
        description?: string;
      };

      const eventTitle = args.title;
      const eventDate = args.date;
      const eventTime = args.time;
      const eventDesc = args.description;

      try {
        const startDateTime = new Date(`${eventDate}T${eventTime || '00:00'}:00`).toISOString();
        const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert([
            {
              user_id: user.id,
              title: eventTitle,
              description: eventDesc || null,
              start_time: startDateTime,
              end_time: endDateTime,
              is_all_day: !eventTime,
              color: '#22c55e',
            },
          ]);

        if (insertError) {
          console.error('Error inserting calendar event:', insertError);
          return NextResponse.json({ error: 'Etkinlik takvime eklenirken veritabanı hatası oluştu.' }, { status: 500 });
        }

        return NextResponse.json({
          answer: `Etkinlik başarıyla takvime eklendi: ${eventTitle}`,
          calendarEvent: {
            title: eventTitle,
            date: eventDate,
            time: eventTime,
          },
        });
      } catch (err) {
        console.error('Failed to insert calendar event:', err);
        return NextResponse.json({ error: 'Etkinlik takvime eklenirken sunucu hatası oluştu.' }, { status: 500 });
      }
    }

    if (functionCall && functionCall.name === 'create_finance_transaction') {
      const args = functionCall.args as {
        type: string;
        amount: number;
        category: string;
        description?: string;
        date?: string;
      };

      const txDate = args.date || new Date().toISOString().split('T')[0];

      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: args.type,
          amount: args.amount,
          category: args.category,
          description: args.description || '',
          date: txDate,
        }]);

      if (insertError) {
        console.error('Finance insert error:', insertError);
        return NextResponse.json({ error: 'Finans işlemi eklenirken hata oluştu.' }, { status: 500 });
      }

      const typeLabel = args.type === 'income' ? 'Gelir' : 'Gider';
      return NextResponse.json({
        answer: `💰 ${typeLabel} başarıyla eklendi: ${args.amount} ₺ - ${args.category}${args.description ? ' (' + args.description + ')' : ''} [${txDate}]`,
        financeTransaction: {
          type: args.type,
          amount: args.amount,
          category: args.category,
          date: txDate,
        },
      });
    }

    if (functionCall && functionCall.name === 'create_task') {
      const args = functionCall.args as {
        title: string;
        due_date?: string;
        priority?: string;
      };

      const { error: insertError } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: args.title,
          due_date: args.due_date || null,
          priority: args.priority || 'medium',
          is_completed: false,
        }]);

      if (insertError) {
        console.error('Task insert error:', insertError);
        return NextResponse.json({ error: 'Görev eklenirken hata oluştu.' }, { status: 500 });
      }

      return NextResponse.json({
        answer: `✅ Görev oluşturuldu: "${args.title}"${args.due_date ? ' (Son tarih: ' + args.due_date + ')' : ''}`,
        task: { title: args.title, due_date: args.due_date, priority: args.priority || 'medium' },
      });
    }

    if (functionCall && functionCall.name === 'update_task_status') {
      const args = functionCall.args as {
        title: string;
        completed: boolean;
      };

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .ilike('title', `%${args.title}%`)
        .limit(1);

      if (!tasks || tasks.length === 0) {
        return NextResponse.json({
          answer: `❌ "${args.title}" adında bir görev bulunamadı.`,
        });
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_completed: args.completed })
        .eq('id', tasks[0].id);

      if (updateError) {
        return NextResponse.json({ error: 'Görev güncellenirken hata oluştu.' }, { status: 500 });
      }

      const statusText = args.completed ? 'tamamlandı ✅' : 'tekrar açıldı';
      return NextResponse.json({
        answer: `Görev "${tasks[0].title}" ${statusText}.`,
        taskUpdate: { title: tasks[0].title, completed: args.completed },
      });
    }

    if (functionCall && functionCall.name === 'create_note') {
      const args = functionCall.args as {
        title: string;
        content: string;
      };

      const { error: insertError } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          title: args.title,
          content: args.content,
        }]);

      if (insertError) {
        console.error('Note insert error:', insertError);
        return NextResponse.json({ error: 'Not eklenirken hata oluştu.' }, { status: 500 });
      }

      return NextResponse.json({
        answer: `📝 Not kaydedildi: "${args.title}"`,
        note: { title: args.title },
      });
    }

    if (functionCall && functionCall.name === 'create_goal') {
      const args = functionCall.args as {
        title: string;
        type: string;
        target_value?: number;
        frequency?: string;
      };

      const table = args.type === 'habit' ? 'habits' : 'goals';
      const insertData: any = {
        user_id: user.id,
        title: args.title,
      };

      if (args.type === 'goal') {
        insertData.progress = 0;
        insertData.color = '#22c55e';
      } else {
        insertData.frequency = args.frequency || 'daily';
        insertData.streak = 0;
        insertData.color = '#22c55e';
      }

      const { error: insertError } = await supabase.from(table).insert([insertData]);

      if (insertError) {
        console.error('Goal/Habit insert error:', insertError);
        return NextResponse.json({ error: 'Hedef/alışkanlık eklenirken hata oluştu.' }, { status: 500 });
      }

      const emoji = args.type === 'habit' ? '🔄' : '🎯';
      return NextResponse.json({
        answer: `${emoji} ${args.type === 'habit' ? 'Alışkanlık' : 'Hedef'} eklendi: "${args.title}"`,
        goal: { title: args.title, type: args.type },
      });
    }

    if (functionCall && functionCall.name === 'get_finance_summary') {
      const args = (functionCall.args as { period?: string }) || {};
      
      let query = supabase.from('transactions').select('*').eq('user_id', user.id);
      
      const now = new Date();
      if (args.period === 'this_month' || !args.period) {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        query = query.gte('date', firstDay);
      } else if (args.period === 'last_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        query = query.gte('date', firstDay).lte('date', lastDay);
      }

      const { data: transactions } = await query.order('date', { ascending: false });
      const txList = transactions || [];
      const totalIncome = txList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const balance = totalIncome - totalExpense;

      const last5 = txList.slice(0, 5).map(t => `${t.type === 'income' ? '📈' : '📉'} ${t.category}: ${t.amount}₺ (${t.date})`).join('\n');

      return NextResponse.json({
        answer: `📊 **Finansal Özet**\n\n💰 Toplam Gelir: **${totalIncome.toLocaleString('tr-TR')} ₺**\n💸 Toplam Gider: **${totalExpense.toLocaleString('tr-TR')} ₺**\n📈 Bakiye: **${balance.toLocaleString('tr-TR')} ₺**\n\n${last5 ? '**Son İşlemler:**\n' + last5 : 'Henüz işlem yok.'}`,
        financeSummary: { totalIncome, totalExpense, balance, count: txList.length },
      });
    }

    if (functionCall && functionCall.name === 'get_tasks_summary') {
      const args = (functionCall.args as { status?: string }) || {};

      let query = supabase.from('tasks').select('*').eq('user_id', user.id);
      if (args.status === 'pending' || !args.status) {
        query = query.eq('is_completed', false);
      } else if (args.status === 'completed') {
        query = query.eq('is_completed', true);
      }

      const { data: tasks } = await query.order('created_at', { ascending: false });
      const taskList = tasks || [];

      const taskLines = taskList.slice(0, 10).map(t => {
        const checkbox = t.is_completed ? '✅' : '⬜';
        const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
        return `${checkbox} ${priority} ${t.title}${t.due_date ? ' (📅 ' + t.due_date + ')' : ''}`;
      }).join('\n');

      return NextResponse.json({
        answer: `📋 **Görev Listesi** (${taskList.length} görev)\n\n${taskLines || 'Görev bulunamadı.'}`,
        tasksSummary: { count: taskList.length, tasks: taskList.slice(0, 10) },
      });
    }

    if (functionCall && functionCall.name === 'get_calendar_events') {
      const args = (functionCall.args as { start_date?: string; end_date?: string }) || {};

      const startDate = args.start_date || new Date().toISOString().split('T')[0];
      const endDate = args.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`)
        .order('start_time', { ascending: true });

      const eventList = events || [];
      const eventLines = eventList.map(e => {
        const time = e.is_all_day ? 'Tüm gün' : new Date(e.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        return `📌 ${e.title} — ${new Date(e.start_time).toLocaleDateString('tr-TR')} ${time}`;
      }).join('\n');

      return NextResponse.json({
        answer: `📅 **Takvim** (${startDate} - ${endDate})\n\n${eventLines || 'Bu tarih aralığında etkinlik yok.'}`,
        calendarSummary: { count: eventList.length },
      });
    }

    if (functionCall && functionCall.name === 'search_files') {
      const args = functionCall.args as { query: string };

      const { data: files } = await supabase
        .from('files')
        .select('id, name, url, type')
        .eq('user_id', user.id)
        .eq('isDeleted', false)
        .ilike('name', `%${args.query}%`)
        .limit(10);

      const fileList = files || [];
      const fileLines = fileList.map(f => `📄 ${f.name}`).join('\n');

      return NextResponse.json({
        answer: `🔍 **Dosya Arama Sonuçları** ("${args.query}")\n\n${fileLines || 'Eşleşen dosya bulunamadı.'}`,
        searchResults: { count: fileList.length, files: fileList },
      });
    }

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
