import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addFile, FileRecord } from '@/lib/db';
import { getEmbedding } from '@/lib/ml';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Vercel için 60 saniyeye uzat

// unpdf ile güvenilir PDF metin çıkarma (Node.js & Edge uyumlu)
import { extractText } from 'unpdf';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const { text, totalPages } = await extractText(uint8Array);

    let fullText = '';
    
    if (Array.isArray(text)) {
      text.forEach((pageText: string, index: number) => {
        const pageNum = index + 1;
        if (pageText && pageText.trim()) {
          fullText += `\n[PAGE: ${pageNum}]\n${pageText.trim()}`;
        }
      });
      console.log(`unpdf sonucu: ${fullText.length} karakter, ${totalPages} sayfa`);
    } else if (typeof text === 'string') {
      fullText = (text as string).trim();
      console.log(`unpdf sonucu: ${fullText.length} karakter (tekil metin)`);
    }

    return fullText;
  } catch (err: any) {
    console.error('unpdf metin çıkarma hatası:', err);
    throw new Error('PDF okuma hatası: ' + (err.message || String(err)));
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err: any) {
    console.error('Word okuma hatası:', err);
    throw new Error('Word okuma hatası: ' + (err.message || String(err)));
  }
}

async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(sheet);
      if (sheetText.trim()) {
        fullText += `\n[SAYFA: ${sheetName}]\n${sheetText.trim()}\n`;
      }
    });
    return fullText;
  } catch (err: any) {
    console.error('Excel okuma hatası:', err);
    throw new Error('Excel okuma hatası: ' + (err.message || String(err)));
  }
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let fullText = '';
    
    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await zip.files[slideFiles[i]].async('string');
      // Slayt metinlerini <a:t> etiketlerinden çek
      const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
        if (slideText.trim()) {
          fullText += `\n[SLAYT: ${i + 1}]\n${slideText.trim()}\n`;
        }
      }
    }
    return fullText;
  } catch (err: any) {
    console.error('PowerPoint okuma hatası:', err);
    throw new Error('PowerPoint okuma hatası: ' + (err.message || String(err)));
  }
}
export async function POST(request: Request) {
  try {
    // Kullanıcı kimliğini doğrula
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const categoryId = formData.get('categoryId') as string | null;
    const date = formData.get('date') as string | null;

    if (!file || !name || !categoryId || !date) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = name.includes('.') ? '.' + name.split('.').pop() : (file.name.includes('.') ? '.' + file.name.split('.').pop() : '');
    const fileId = uuidv4();
    const fileName = `${fileId}${ext}`;
    
    // Supabase Storage'a Yükleme (Service Role kullanarak RLS'yi atla)
    const { error: storageError } = await supabaseAdmin.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      });
      
    if (storageError) {
      console.error('Supabase Storage Hatası:', storageError);
      throw storageError;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const url = publicUrlData.publicUrl;

    let extractedText = '';
    let embedding: number[] = [];
    const chunks: { text: string; embedding: number[] }[] = [];

    if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPdf(buffer);
      console.log(`PDF metin çıkarma sonucu: ${extractedText.length} karakter`);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await extractTextFromDocx(buffer);
      console.log(`Word metin çıkarma sonucu: ${extractedText.length} karakter`);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      extractedText = await extractTextFromXlsx(buffer);
      console.log(`Excel metin çıkarma sonucu: ${extractedText.length} karakter`);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      extractedText = await extractTextFromPptx(buffer);
      console.log(`PowerPoint metin çıkarma sonucu: ${extractedText.length} karakter`);
    }

    // Metin başarıyla çıkarıldıysa Yapay Zeka vektörlerini oluştur (Gemini key varsa)
    if (extractedText.trim()) {
        try {
          // Tüm metin için genel embedding
          embedding = await getEmbedding(extractedText.substring(0, 2048));

          // 500 karakterlik parçalara (chunk) böl — daha hassas arama için
          const chunkSize = 500;
          for (let i = 0; i < extractedText.length; i += chunkSize) {
            const chunkText = extractedText.substring(i, i + chunkSize);
            if (chunkText.trim().length > 20) {
              const chunkEmbedding = await getEmbedding(chunkText);
              chunks.push({ text: chunkText, embedding: chunkEmbedding });
            }
          }
          console.log(`Embedding oluşturuldu: ${chunks.length} chunk`);
        } catch (embeddingErr) {
          console.error('Embedding oluşturma hatası:', embeddingErr);
          // Embedding hatası yüklemeyi engellememeli
        }
      }
    

    const newRecord: FileRecord = {
      id: fileId,
      name,
      categoryId,
      date,
      type: file.type,
      url,
      extractedText,
      createdAt: new Date().toISOString(),
      embedding,
      chunks,
      isDeleted: false,
      user_id: user.id,
    };

    await addFile(newRecord);

    return NextResponse.json({ success: true, file: newRecord, extractedTextLength: extractedText.length, chunksCount: chunks.length });
  } catch (error) {
    console.error('Upload hatası:', error);
    return NextResponse.json({ error: 'Dosya yükleme sırasında bir hata oluştu.' }, { status: 500 });
  }
}
