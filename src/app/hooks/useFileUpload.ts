'use client';

import { useState } from 'react';

export function useFileUpload() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // -------------------------------------------------------
  // Client-side metin çıkarma (browser'da, timeout yok)
  // -------------------------------------------------------
  const extractTextClientSide = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const type = file.type;

      if (type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = (content.items as any[]).map((item: any) => item.str || '').join(' ').trim();
          if (pageText) text += `\n[PAGE: ${i}]\n${pageText}`;
        }
        return text;
      }

      if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value || '';
      }

      if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'array' });
        let text = '';
        workbook.SheetNames.forEach((name: string) => {
          const sheet = workbook.Sheets[name];
          const sheetText = XLSX.utils.sheet_to_txt(sheet);
          if (sheetText.trim()) text += `\n[SAYFA: ${name}]\n${sheetText.trim()}`;
        });
        return text;
      }

      if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(buffer);
        let text = '';
        const slideFiles = Object.keys(zip.files)
          .filter(n => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
          .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
        for (let i = 0; i < slideFiles.length; i++) {
          const slideXml = await zip.files[slideFiles[i]].async('string');
          const matches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
          if (matches) {
            const slideText = matches.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' ').trim();
            if (slideText) text += `\n[SLAYT: ${i + 1}]\n${slideText}`;
          }
        }
        return text;
      }

      return '';
    } catch (err: any) {
      console.error('Client-side metin çıkarma hatası:', err);
      return ''; // Hata durumunda boş string — yükleme devam eder
    }
  };

  // -------------------------------------------------------
  // Upload — Client-side metin çıkarma + Signed URL yükleme
  // -------------------------------------------------------
  const handleUpload = async (e: React.FormEvent, categories: any[]) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || !uploadCategory || !uploadDate) {
      alert('Lütfen tüm alanları doldurun:\n' +
        (!uploadName ? '• Dosya ismi eksik\n' : '') +
        (!uploadCategory ? '• Kategori seçilmedi\n' : '') +
        (!uploadDate ? '• Tarih girilmedi\n' : '') +
        (!uploadFile ? '• Dosya seçilmedi\n' : ''));
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Hazırlanıyor...');

    try {
      // Adım 1: İmzalı URL al + Metni browser'da çıkar (paralel)
      setUploadStatus('Bağlanıyor ve metin okunuyor... (Adım 1/3)');
      setUploadProgress(5);

      const [urlRes, extractedText] = await Promise.all([
        fetch('/api/get-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: uploadFile.name, fileType: uploadFile.type }),
        }),
        extractTextClientSide(uploadFile),
      ]);

      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || 'URL alınamadı');
      const { signedUrl, storagePath, fileId } = urlData;

      console.log(`Client metin çıkarma: ${extractedText.length} karakter`);
      setUploadProgress(40);

      // Adım 2: Dosyayı Supabase'e yükle (Vercel bypass)
      setUploadStatus('Dosya yükleniyor... (Adım 2/3)');

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type || 'application/octet-stream' },
        body: uploadFile,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error('Dosya yüklenemedi: ' + errText);
      }

      setUploadProgress(70);
      setUploadStatus('Kayıt oluşturuluyor... (Adım 3/3)');

      // Adım 3: Metadata + çıkarılan metin gönder — sunucu hiç dosya indirmiyor
      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          storagePath,
          name: uploadName,
          categoryId: uploadCategory,
          date: uploadDate,
          extractedText, // Browser'dan geliyor
        }),
      });

      const processData = await processRes.json();
      setUploadProgress(100);

      if (processData.success) {
        const textInfo = processData.extractedTextLength > 0
          ? `✅ ${processData.extractedTextLength} karakter okundu, ${processData.chunksCount} parçaya bölündü.`
          : '⚠️ Metin okunamadı, sadece dosya adıyla aranabilir.';
        alert('Dosya başarıyla yüklendi!\n' + textInfo);
        setIsUploadModalOpen(false);
        setUploadName(''); setUploadCategory(''); setUploadDate(''); setUploadFile(null);
      } else {
        alert('İşlem hatası: ' + processData.error);
      }
    } catch (err: any) {
      console.error('Yükleme hatası:', err);
      alert('Yükleme sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return {
    isUploadModalOpen, setIsUploadModalOpen,
    uploadName, setUploadName,
    uploadCategory, setUploadCategory,
    uploadDate, setUploadDate,
    uploadFile, setUploadFile,
    isUploading,
    uploadProgress,
    uploadStatus,
    handleUpload,
  };
}
