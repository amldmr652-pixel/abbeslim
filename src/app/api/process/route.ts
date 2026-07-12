import { NextResponse } from 'next/server';
import { addFile, FileRecord } from '@/lib/db';
import { getEmbedding } from '@/lib/ml';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const supabaseAdmin = createAdminClient();

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Kullanıcı doğrulama
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Geçersiz istek formatı.' }, { status: 400 });
    }

    const { fileId, fileName, fileType, storagePath, name, categoryId, date, extractedText: clientText } = body;

    if (!fileId || !storagePath || !name || !categoryId || !date) {
      return NextResponse.json({ error: 'Eksik parametreler.' }, { status: 400 });
    }

    // Public URL oluştur
    const { data: publicUrlData } = supabaseAdmin.storage.from('uploads').getPublicUrl(storagePath);
    const url = publicUrlData.publicUrl;

    // Browser'dan gelen metni kullan — sunucu hiç indirmiyor, timeout yok
    const extractedText: string = (typeof clientText === 'string' ? clientText : '').substring(0, 100000);

    let embedding: number[] = [];
    const chunks: { text: string; embedding: number[] }[] = [];

    if (extractedText.trim()) {
      try {
        // Ana embedding — tek API çağrısı
        embedding = await getEmbedding(extractedText.substring(0, 2048));

        // Daha geniş kapsam ve daha iyi anlamsal bağlam için chunk boyutunu ve sayısını artırıyoruz
        const chunkSize = 2000;
        const maxChunks = 20;
        let chunkCount = 0;
        for (let i = 0; i < extractedText.length && chunkCount < maxChunks; i += chunkSize) {
          const chunkText = extractedText.substring(i, i + chunkSize);
          if (chunkText.trim().length > 20) {
            const chunkEmbedding = await getEmbedding(chunkText);
            chunks.push({ text: chunkText, embedding: chunkEmbedding });
            chunkCount++;
          }
        }
        console.log(`Embedding: ${chunks.length} chunk oluşturuldu`);
      } catch (embeddingErr) {
        console.error('Embedding hatası:', embeddingErr);
        // Embedding başarısız olsa bile kaydı oluştur
      }
    }

    const newRecord: FileRecord = {
      id: fileId,
      name,
      categoryId,
      date,
      type: fileType || 'application/octet-stream',
      url,
      extractedText,
      createdAt: new Date().toISOString(),
      embedding,
      chunks,
      isDeleted: false,
      user_id: user.id,
    };

    await addFile(newRecord);

    return NextResponse.json({
      success: true,
      file: newRecord,
      extractedTextLength: extractedText.length,
      chunksCount: chunks.length,
    });

  } catch (error: any) {
    console.error('Process route hatası:', error);
    return NextResponse.json(
      { error: 'Dosya işlenirken bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}
