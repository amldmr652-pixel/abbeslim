import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import { getEmbedding, detectAndExtractArabicFontMap } from '@/lib/ml';
import { createAdminClient } from '@/utils/supabase/admin';

const supabaseAdmin = createAdminClient();

export const maxDuration = 60;

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
      console.log(`unpdf: ${fullText.length} karakter, ${totalPages} sayfa`);
    } else if (typeof text === 'string') {
      fullText = (text as string).trim();
    }
    return fullText;
  } catch (err: any) {
    console.error('PDF metin hatası:', err);
    return '';
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch { return ''; }
}

async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(sheet);
      if (sheetText.trim()) fullText += `\n[SAYFA: ${sheetName}]\n${sheetText.trim()}\n`;
    });
    return fullText;
  } catch { return ''; }
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let fullText = '';
    const slideFiles = Object.keys(zip.files)
      .filter(n => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
      .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await zip.files[slideFiles[i]].async('string');
      const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
        if (slideText.trim()) fullText += `\n[SLAYT: ${i + 1}]\n${slideText.trim()}\n`;
      }
    }
    return fullText;
  } catch { return ''; }
}

export async function POST(request: Request) {
  try {
    const { fileId, storagePath, fileType } = await request.json();

    if (!fileId || !storagePath) {
      return NextResponse.json({ error: 'Eksik parametreler.' }, { status: 400 });
    }

    const textTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    let extractedText = '';
    let embedding: number[] = [];
    const chunks: { text: string; embedding: number[] }[] = [];

    if (fileType && textTypes.includes(fileType)) {
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('uploads')
        .download(storagePath);

      if (!downloadError && fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());

        if (fileType === 'application/pdf') extractedText = await extractTextFromPdf(buffer);
        else if (fileType.includes('wordprocessingml')) extractedText = await extractTextFromDocx(buffer);
        else if (fileType.includes('spreadsheetml')) extractedText = await extractTextFromXlsx(buffer);
        else if (fileType.includes('presentationml')) extractedText = await extractTextFromPptx(buffer);
      }
    }

    let processedText = extractedText;
    if (extractedText.trim()) {
      try {
        const fontMap = await detectAndExtractArabicFontMap(extractedText.substring(0, 5000));
        const keys = Object.keys(fontMap);
        if (keys.length > 0) {
          console.log(`Bozuk Arapça font haritası uygulandı: ${keys.length} harf değiştiriliyor...`);
          // Bütün harfleri değiştir
          let cleanText = processedText;
          keys.forEach(k => {
            if (k) {
              const reg = new RegExp(k.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
              cleanText = cleanText.replace(reg, fontMap[k]);
            }
          });
          
          // Eşleme bilgisini metnin en başına header satırı olarak ekle
          const header = `[FONTMAP:${JSON.stringify(fontMap)}]\n`;
          processedText = header + cleanText;
          console.log(`Bozuk metin temizlendi. İlk 200 karakter:`, cleanText.substring(0, 200));
        }
      } catch (err) {
        console.error('Yapay zeka font temizleme hatası:', err);
      }
    }

    if (processedText.trim()) {
      try {
        embedding = await getEmbedding(processedText.substring(0, 2048));
        const chunkSize = 500;
        for (let i = 0; i < processedText.length; i += chunkSize) {
          const chunkText = processedText.substring(i, i + chunkSize);
          if (chunkText.trim().length > 20) {
            chunks.push({ text: chunkText, embedding: await getEmbedding(chunkText) });
          }
        }
      } catch (e) { console.error('Embedding hatası:', e); }
    }

    // DB'yi güncelle
    await supabaseAdmin.from('files').update({
      extractedText: processedText,
      embedding,
      chunks,
    }).eq('id', fileId);

    console.log(`Metin çıkarma tamamlandı: ${fileId}, ${extractedText.length} karakter`);
    return NextResponse.json({ success: true, extractedTextLength: extractedText.length, chunksCount: chunks.length });

  } catch (error: any) {
    console.error('Extract route hatası:', error);
    return NextResponse.json({ error: error?.message || 'Bilinmeyen hata' }, { status: 500 });
  }
}
